import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getGeminiClient } from '@/lib/ai/gemini';
import { checkCredits, deductCredits } from '@/lib/billing/credits';
import type { ContentType } from '@/types/database';

const SYSTEM_PROMPTS: Record<ContentType, string> = {
  instagram_caption:
    'You are an expert Instagram copywriter. Write high-converting, scroll-stopping Instagram captions with a strong hook, engaging body, relevant emojis, call-to-action (CTA), and 5-10 targeted hashtags.',
  facebook_caption:
    'You are a Facebook advertising and social media specialist. Write engaging Facebook posts that drive conversations, comments, and shares.',
  linkedin_post:
    'You are a B2B marketing thought leader on LinkedIn. Write insightful, structured posts with short punchy paragraphs, actionable takeaways, and an engaging question at the end.',
  x_post:
    'You are an expert Twitter/X ghostwriter. Write viral tweets or short threads (2-4 tweets) that maximize impressions, retweets, and bookmarks.',
  pinterest_description:
    'You are a Pinterest marketing expert. Write keyword-rich, inspiring pin descriptions that boost click-throughs to websites.',
  telegram_message:
    'You are a community manager. Write clear, direct, and engaging broadcast messages for Telegram channels with formatting and action links.',
  whatsapp_message:
    'You are a conversational marketing copywriter. Write personal, friendly, and persuasive WhatsApp broadcast or customer messages.',
  email_campaign:
    'You are a direct-response email marketing expert. Write compelling emails with 2-3 high-open subject lines, preview text, persuasive story/body, and clear CTA buttons.',
  landing_page_copy:
    'You are a world-class landing page copywriter. Write structured landing page copy in markdown format, including hero headline, subheadline, benefits bullet points, social proof, and primary CTA.',
  ad_copy:
    'You are a performance marketing copywriter for Meta and Google Ads. Write 3 variations of high-converting ad copy with primary text, headlines, and call to action.',
  product_description:
    'You are an e-commerce copywriting specialist. Write persuasive, benefit-driven product descriptions highlighting key features, specifications, and buying incentives.',
  seo_meta:
    'You are an SEO specialist. Write optimized Title Tag (under 60 characters), Meta Description (under 160 characters), and primary target keywords.',
  headline:
    'You are a master headline copywriter. Provide 5-8 captivating headlines spanning curiosity, urgency, value, and emotional triggers.',
  blog_article:
    'You are a professional content writer. Write a comprehensive, SEO-friendly blog post in markdown format with H1 title, H2/H3 subheadings, actionable sections, and a conclusion.',
  multi_language:
    'You are a professional multilingual translator and copy adapter. Translate and culturally adapt the content into English, Spanish, French, and German.',
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in to generate content.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      type,
      prompt,
      tone = 'professional',
      language = 'en',
      model = 'gemini-2.5-flash',
      productId = null,
      organizationId,
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

    let productBrief = 'No product record was selected. Use only the user request.';
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

    // 1. Guardrail: Check available content credits before calling Gemini API
    const creditCheck = await checkCredits(supabase, organizationId, 'content', 1);
    if (!creditCheck.hasEnough) {
      return NextResponse.json(
        {
          error: `Insufficient AI Content credits. You have ${creditCheck.remaining} credits remaining. Please upgrade your plan in Billing to continue generating content.`,
          code: 'INSUFFICIENT_CREDITS',
          remaining: creditCheck.remaining,
          required: 1,
          creditType: 'content',
        },
        { status: 402 }
      );
    }

    const gemini = getGeminiClient();
    const systemPrompt =
      SYSTEM_PROMPTS[type as ContentType] ??
      'You are a professional marketing copywriter. Create compelling and effective copy based on user requirements.';

    const userPrompt = `
Topic / Request: ${prompt}
Desired Tone: ${tone}
Target Language: ${language}
${type ? `Content Format: ${type.replace(/_/g, ' ')}` : ''}
  Product Details: ${productBrief}

  Create complete, polished, ready-to-publish sales content that helps convert a real customer. Start with a strong hook, clearly explain the product and customer benefit, include specific proof/details from the product record, an offer or price when available, objection handling, trust-building language, and one clear call to action. For ad/social formats, return the final post copy with headline, primary text, CTA, and relevant hashtags where appropriate. Never invent product facts or guarantees.
`.trim();

    const selectedModel =
      model && model.startsWith('gemini') && model !== 'gemini-2.0-flash'
        ? model
        : 'gemini-2.5-flash';

    const response = await gemini.models.generateContent({
      model: selectedModel,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    const generatedContent = response.text?.trim() || '';
    const tokensUsed = response.usageMetadata?.totalTokenCount ?? 0;

    const { data: record, error: dbError } = await supabase
      .from('content_generations')
      .insert({
        organization_id: organizationId,
        product_id: productId,
        type,
        prompt,
        tone,
        language,
        model: selectedModel,
        content: generatedContent,
        status: 'completed',
        tokens_used: tokensUsed,
        created_by: user.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save generated content to database.', details: dbError.message },
        { status: 500 }
      );
    }

    // 2. Guardrail: Deduct 1 content credit atomically
    const deductResult = await deductCredits(
      supabase,
      organizationId,
      'content',
      1,
      `Generated ${type ? type.replace(/_/g, ' ') : 'marketing copy'}`,
      record.id
    );

    return NextResponse.json({
      data: record,
      credits: {
        remaining: deductResult.remaining,
        deducted: 1,
        creditType: 'content',
      },
    });
  } catch (error: any) {
    console.error('Content generation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate content.' },
      { status: 500 }
    );
  }
}
