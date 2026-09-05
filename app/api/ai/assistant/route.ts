import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getGeminiClient } from '@/lib/ai/gemini';

const SYSTEM_PROMPT = `You are GorillaGo's AI Marketing Copilot. 
You help marketing teams, agencies, and business owners scale their marketing, automate creative campaigns, analyze performance across social channels (Instagram, Facebook, LinkedIn, X, TikTok), and optimize ad spend (Meta Ads, Google Ads).

Guidelines:
1. Provide concise, strategic, and immediately actionable advice.
2. Structure recommendations clearly using bullet points and numbered takeaways.
3. If the user asks for copy, hashtags, or campaign ideas, draft production-ready samples directly in your response.
4. Mention relevant GorillaGo features when helpful (e.g., Content Studio, Image Studio, Video Studio, Ad Campaign Manager, Publishing Calendar).`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in to chat with AI Assistant.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { conversationId, content, organizationId } = body;

    if (!conversationId || !content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'conversationId and content are required.' },
        { status: 400 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required.' },
        { status: 400 }
      );
    }

    // 1. Ensure conversation exists in database to satisfy foreign key constraint
    const { data: existingConv } = await supabase
      .from('ai_conversations')
      .select('id, title')
      .eq('id', conversationId)
      .maybeSingle();

    if (!existingConv) {
      const initialTitle =
        content.trim().length > 35
          ? `${content.trim().slice(0, 35)}...`
          : content.trim();

      const { error: convCreateError } = await supabase
        .from('ai_conversations')
        .insert({
          id: conversationId,
          organization_id: organizationId,
          title: initialTitle,
          created_by: user.id,
        });

      if (convCreateError) {
        console.warn('Auto-create conversation notice:', convCreateError.message);
      }
    }

    // 2. Save user message to database
    const { error: userMsgError } = await supabase.from('ai_messages').insert({
      conversation_id: conversationId,
      organization_id: organizationId,
      role: 'user',
      content: content.trim(),
      actions: [],
      action_status: 'pending',
    });

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError);
      return NextResponse.json(
        { error: 'Failed to save user message.', details: userMsgError.message },
        { status: 500 }
      );
    }

    // 3. Fetch recent conversation context (last 8 messages)
    const { data: pastMessages } = await supabase
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(8);

    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (pastMessages && pastMessages.length > 0) {
      for (const msg of pastMessages) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
          });
        }
      }
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: content.trim() }],
      });
    }

    // 4. Call Google Gemini 2.5 Flash
    const gemini = getGeminiClient();
    const response = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
      },
    });

    const replyContent =
      response.text?.trim() ||
      'I apologize, but I could not generate a response at this moment.';
    const tokensUsed = response.usageMetadata?.totalTokenCount ?? 0;

    // Detect actionable suggestions if relevant
    const actions: Array<{ type: string; label: string; title: string; description: string }> = [];
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('post') || lowerContent.includes('caption')) {
      actions.push({
        type: 'generate_content',
        label: 'Open in Content Studio',
        title: 'Open in Content Studio',
        description: 'Draft and schedule this post for your connected social channels.',
      });
    } else if (lowerContent.includes('campaign') || lowerContent.includes('ad')) {
      actions.push({
        type: 'create_campaign',
        label: 'Create Ad Campaign',
        title: 'Create Ad Campaign',
        description: 'Set budget, audience targeting, and creatives in Ads Manager.',
      });
    } else if (lowerContent.includes('image') || lowerContent.includes('banner')) {
      actions.push({
        type: 'generate_content',
        label: 'Generate Image in Studio',
        title: 'Generate Image in Studio',
        description: 'Create high-resolution AI visuals with Google Imagen 3.',
      });
    }

    // 5. Save assistant response to database
    const { data: assistantMsg, error: assistantError } = await supabase
      .from('ai_messages')
      .insert({
        conversation_id: conversationId,
        organization_id: organizationId,
        role: 'assistant',
        content: replyContent,
        actions,
        action_status: 'pending',
        model: 'gemini-2.5-flash',
        tokens_used: tokensUsed,
      })
      .select()
      .single();

    if (assistantError) {
      console.error('Error saving assistant message:', assistantError);
      return NextResponse.json(
        { error: 'Failed to save assistant message.', details: assistantError.message },
        { status: 500 }
      );
    }

    // 6. Update conversation title if still default
    const { data: conv } = await supabase
      .from('ai_conversations')
      .select('title')
      .eq('id', conversationId)
      .maybeSingle();

    if (conv && conv.title === 'New Conversation') {
      const summaryTitle =
        content.trim().length > 35
          ? `${content.trim().slice(0, 35)}...`
          : content.trim();

      await supabase
        .from('ai_conversations')
        .update({ title: summaryTitle })
        .eq('id', conversationId);
    }

    return NextResponse.json({ data: assistantMsg });
  } catch (error: any) {
    console.error('Assistant chat error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate assistant response.' },
      { status: 500 }
    );
  }
}
