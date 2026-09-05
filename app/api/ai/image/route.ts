import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getGeminiClient } from '@/lib/ai/gemini';
import { checkCredits, deductCredits } from '@/lib/billing/credits';
import { uploadBufferToStorage } from '@/lib/storage/media';
import type { MediaCategory } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in to generate images.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      prompt,
      category = 'product_image',
      productId = null,
      platform = null,
      organizationId,
      model = 'imagen-3.0-generate-002',
    } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required.' },
        { status: 400 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required.' },
        { status: 400 }
      );
    }

    let productBrief = 'No product record was selected. Infer only from the user request.';
    if (productId) {
      const { data: product } = await supabase
        .from('products')
        .select('name, description, category, price, compare_at_price, currency, tags, seo_description')
        .eq('id', productId)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (product) {
        productBrief = JSON.stringify(product);
      }
    }

    // 1. Guardrail: Check image credits before invoking Imagen 3
    const creditCheck = await checkCredits(supabase, organizationId, 'image', 1);
    if (!creditCheck.hasEnough) {
      return NextResponse.json(
        {
          error: `Insufficient AI Image credits. You have ${creditCheck.remaining} credits remaining. Please upgrade your plan in Billing to continue generating images.`,
          code: 'INSUFFICIENT_CREDITS',
          remaining: creditCheck.remaining,
          required: 1,
          creditType: 'image',
        },
        { status: 402 }
      );
    }

    // Determine optimal dimensions and aspect ratio
    let aspectRatio: '1:1' | '9:16' | '16:9' = '1:1';
    let dimensions = { width: 1024, height: 1024 };

    if (category === 'story' || category === 'reel') {
      aspectRatio = '9:16';
      dimensions = { width: 720, height: 1280 };
    } else if (category === 'banner' || category === 'offer_banner' || category === 'festival_banner' || category === 'poster') {
      aspectRatio = '16:9';
      dimensions = { width: 1280, height: 720 };
    }

    // 1. Enhance prompt for high-converting commercial photography with Gemini 2.5 Flash
    let enhancedPrompt = `Create a complete, sales-focused ${category.replace(/_/g, ' ')} advertisement for this product: ${productBrief}. User direction: ${prompt.trim()}. Include a clear visual product benefit, offer or price when available, brand-safe composition, a readable headline, supporting proof point, and a strong call to action. Make it look like a finished ${platform || 'social media'} ad, not a plain product photo. Use crisp commercial lighting and premium realistic detail.`;
    try {
      const gemini = getGeminiClient();
      const promptRes = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a direct-response advertising art director. Convert this request into a single detailed prompt for an AI commercial image generator. The final image must be a complete customer-facing ad creative, not just an image of the product.
Category: ${category}
User Request: ${prompt}
      Product Details: ${productBrief}
      Platform: ${platform || 'social media'}

      Include: a scroll-stopping hook, product benefit, offer/price if available, trust signal, and CTA. Keep all on-image text short, legible, correctly spelled, and visually hierarchical. Do not invent medical, financial, or guaranteed claims. Output ONLY the prompt text (max 120 words), no conversational text or quotes.`,
      });
      const generated = promptRes.text?.trim();
      if (generated && generated.length > 10) {
        enhancedPrompt = generated;
      }
    } catch (enhErr) {
      console.warn('Gemini prompt enhancement notice:', enhErr);
    }

    // 2. Generate high-resolution visual using FLUX AI engine
    const seed = Math.floor(Math.random() * 10000000);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      enhancedPrompt
    )}?width=${dimensions.width}&height=${dimensions.height}&model=flux&nologo=true&seed=${seed}`;

    const imgResponse = await fetch(pollinationsUrl, {
      headers: {
        'User-Agent': 'GorillaGo-Commercial-AI/1.0',
      },
      signal: AbortSignal.timeout(45000), // 45s timeout for high-res generation
    });

    if (!imgResponse.ok) {
      throw new Error(`AI Image Generation failed with status code ${imgResponse.status}`);
    }

    const imageArrayBuffer = await imgResponse.arrayBuffer();
    const buffer = Buffer.from(imageArrayBuffer);

    // 3. Storage persistence (attempt Supabase Storage bucket, fallback to resilient CDN URL)
    let finalImageUrl = pollinationsUrl;
    const fileName = `ai-images/${organizationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

    try {
      const uploadResult = await uploadBufferToStorage(supabase, buffer, fileName, 'image/jpeg');
      if (uploadResult.success && uploadResult.publicUrl) {
        finalImageUrl = uploadResult.publicUrl;
      }
    } catch (storageErr) {
      console.warn('Storage upload fallback notice:', storageErr);
    }

    // 4. Save generated asset to database
    const { data: record, error: dbError } = await supabase
      .from('media_assets')
      .insert({
        organization_id: organizationId,
        product_id: productId,
        type: 'image',
        category: category as MediaCategory,
        url: finalImageUrl,
        thumbnail_url: finalImageUrl,
        platform,
        dimensions,
        format: 'jpg',
        file_size_bytes: buffer.length,
        ai_generated: true,
        ai_prompt: prompt,
        model: 'flux-1.0-commercial',
        metadata: {
          enhanced_prompt: enhancedPrompt,
          product_brief: productBrief,
          creative_type: 'complete_sales_ad',
          aspect_ratio: aspectRatio,
          seed,
        },
        created_by: user.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save generated image to database.', details: dbError.message },
        { status: 500 }
      );
    }

    // 5. Deduct 1 image credit atomically
    const deductResult = await deductCredits(
      supabase,
      organizationId,
      'image',
      1,
      `Generated ${category} image`,
      record.id
    );

    return NextResponse.json({
      data: record,
      credits: {
        remaining: deductResult.remaining,
        deducted: 1,
        creditType: 'image',
      },
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate image.' },
      { status: 500 }
    );
  }
}
