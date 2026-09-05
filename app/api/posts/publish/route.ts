import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { dispatchSocialPost } from '@/lib/publishing/engine';
import type { CampaignPost, SocialAccount } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in to publish posts.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required.' }, { status: 400 });
    }

    // 1. Fetch post
    const { data: post, error: postError } = await supabase
      .from('campaign_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found.' },
        { status: 404 }
      );
    }

    const campaignPost = post as CampaignPost;

    // 2. Fetch social account if linked
    let socialAccount: SocialAccount | null = null;
    if (campaignPost.social_account_id) {
      const { data: sa } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('id', campaignPost.social_account_id)
        .maybeSingle();

      if (sa) socialAccount = sa as SocialAccount;
    }

    // 3. Mark as publishing
    await supabase
      .from('campaign_posts')
      .update({ status: 'publishing', updated_at: new Date().toISOString() })
      .eq('id', postId);

    // 4. Dispatch through publishing engine
    const publishResult = await dispatchSocialPost({
      id: campaignPost.id,
      platform: campaignPost.platform,
      content: campaignPost.content,
      hashtags: campaignPost.hashtags ?? [],
      mediaUrls: Array.isArray(campaignPost.media_urls) ? (campaignPost.media_urls as string[]) : [],
      socialAccount,
    });

    const nowIso = new Date().toISOString();

    if (!publishResult.success) {
      // Mark as failed
      const { data: failedPost } = await supabase
        .from('campaign_posts')
        .update({
          status: 'failed',
          error_message: publishResult.error || 'Failed to publish to platform',
          updated_at: nowIso,
        })
        .eq('id', postId)
        .select()
        .single();

      return NextResponse.json(
        {
          error: publishResult.error || 'Failed to publish post.',
          post: failedPost,
        },
        { status: 400 }
      );
    }

    // Mark as published
    const { data: publishedPost, error: updateError } = await supabase
      .from('campaign_posts')
      .update({
        status: 'published',
        published_at: publishResult.publishedAt || nowIso,
        external_post_id: publishResult.externalPostId,
        error_message: null,
        scheduled_at: null,
        updated_at: nowIso,
      })
      .eq('id', postId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update post after publishing:', updateError);
    }

    return NextResponse.json({
      success: true,
      post: publishedPost || campaignPost,
      externalPostId: publishResult.externalPostId,
    });
  } catch (err: any) {
    console.error('Publish post route error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to publish post.' },
      { status: 500 }
    );
  }
}
