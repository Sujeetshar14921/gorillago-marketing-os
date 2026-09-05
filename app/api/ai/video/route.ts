import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getReplicateClient } from '@/lib/ai/replicate';
import { checkCredits, deductCredits } from '@/lib/billing/credits';
import { uploadRemoteUrlToStorage } from '@/lib/storage/media';
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
        { error: 'Unauthorized: Please log in to generate videos.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      prompt,
      category = 'reel',
      productId = null,
      platform = null,
      organizationId,
      durationSec = 15,
      style = 'cinematic',
      voiceover = null,
      music = null,
      captions = false,
      model = 'minimax/video-01',
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

    // 1. Guardrail: Check video credits before invoking Replicate
    const creditCheck = await checkCredits(supabase, organizationId, 'video', 1);
    if (!creditCheck.hasEnough) {
      return NextResponse.json(
        {
          error: `Insufficient AI Video credits. You have ${creditCheck.remaining} credits remaining. Free tier does not include video generation. Please upgrade to Starter or Growth in Billing to generate AI videos.`,
          code: 'INSUFFICIENT_CREDITS',
          remaining: creditCheck.remaining,
          required: 1,
          creditType: 'video',
        },
        { status: 402 }
      );
    }

    const replicate = getReplicateClient();

    const isVertical = category === 'reel' || category === 'story' || category === 'thumbnail';
    const dimensions = isVertical
      ? { width: 1080, height: 1920 }
      : { width: 1920, height: 1080 };

    const enhancedPrompt = `Create a complete ${platform || 'social media'} sales advertisement video for this product: ${productBrief}. User direction: ${prompt.trim()}. Build a clear ${durationSec}-second storyboard: 0-3s scroll-stopping hook, product reveal, 2-3 benefit/proof moments, offer or price when available, trust-building detail, and a final branded CTA to buy or learn more. Include concise on-screen text and a natural voiceover script that matches the visuals. Style: ${style}; music: ${music || 'none'}; voiceover: ${voiceover || 'none'}; captions: ${captions ? 'on' : 'off'}. Make it feel like a finished conversion-focused ad, not an abstract cinematic clip. No unsupported medical, financial, or guaranteed claims.`;

    // Run video generation through Replicate model
    // minimax/video-01 generates realistic cinematic video
    const output: any = await replicate.run(
      'minimax/video-01',
      {
        input: {
          prompt: enhancedPrompt,
          prompt_optimizer: true,
        },
      }
    );

    let videoUrl = '';
    if (typeof output === 'string') {
      videoUrl = output;
    } else if (Array.isArray(output) && output.length > 0) {
      videoUrl = String(output[0]);
    } else if (output && typeof output === 'object' && 'url' in output) {
      videoUrl = String(output.url);
    }

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'No video was returned by the AI provider.' },
        { status: 500 }
      );
    }

    // Persist temporary Replicate video output permanently into Supabase Storage
    let finalVideoUrl = videoUrl;
    let finalSizeBytes = 5 * 1024 * 1024;

    const videoFileName = `ai-videos/${organizationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`;
    const storageResult = await uploadRemoteUrlToStorage(supabase, videoUrl, videoFileName, 'video/mp4');

    if (storageResult.success && storageResult.publicUrl) {
      finalVideoUrl = storageResult.publicUrl;
      if (storageResult.fileSizeBytes) {
        finalSizeBytes = storageResult.fileSizeBytes;
      }
    } else {
      console.warn('Could not mirror video to Supabase Storage, using provider URL:', storageResult.error);
    }

    const { data: record, error: dbError } = await supabase
      .from('media_assets')
      .insert({
        organization_id: organizationId,
        product_id: productId,
        type: 'video',
        category: category as MediaCategory,
        url: finalVideoUrl,
        thumbnail_url: finalVideoUrl,
        platform,
        dimensions,
        format: 'mp4',
        file_size_bytes: finalSizeBytes,
        ai_generated: true,
        ai_prompt: prompt,
        model: model || 'minimax/video-01',
        metadata: {
          duration_sec: durationSec,
          style,
          product_brief: productBrief,
          creative_type: 'complete_sales_ad',
          voiceover,
          music,
          captions,
          original_provider_url: videoUrl !== finalVideoUrl ? videoUrl : undefined,
        },
        created_by: user.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save generated video to database.', details: dbError.message },
        { status: 500 }
      );
    }

    // 2. Guardrail: Deduct 1 video credit atomically
    const deductResult = await deductCredits(
      supabase,
      organizationId,
      'video',
      1,
      `Generated ${category} video (${durationSec}s)`,
      record.id
    );

    return NextResponse.json({
      data: record,
      credits: {
        remaining: deductResult.remaining,
        deducted: 1,
        creditType: 'video',
      },
    });
  } catch (error: any) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate video.' },
      { status: 500 }
    );
  }
}
