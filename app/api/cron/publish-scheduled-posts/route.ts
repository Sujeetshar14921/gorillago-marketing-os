import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { dispatchSocialPost } from '@/lib/publishing/engine';
import type { SocialAccount, SocialPlatform } from '@/types/database';

export const dynamic = 'force-dynamic';

interface ClaimedPost {
  id: string;
  organization_id: string;
  campaign_id: string;
  social_account_id?: string | null;
  platform: SocialPlatform;
  content: string | null;
  media_urls: string[] | any;
  hashtags: string[];
  scheduled_at: string;
}

export async function GET(request: NextRequest) {
  return handleScheduledWorker(request);
}

export async function POST(request: NextRequest) {
  return handleScheduledWorker(request);
}

async function handleScheduledWorker(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // 1. Authorization: either valid CRON_SECRET or an authenticated user session
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    const customHeader = request.headers.get('x-cron-secret');

    const isSecretAuthorized =
      cronSecret &&
      (authHeader === `Bearer ${cronSecret}` || customHeader === cronSecret);

    if (!isSecretAuthorized) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized: Valid CRON_SECRET or authenticated user session required.' },
          { status: 401 }
        );
      }
    }

    // 2. Claim due scheduled posts
    let claimedPosts: ClaimedPost[] = [];

    const { data: rpcData, error: rpcError } = await supabase.rpc('claim_due_scheduled_posts', {
      p_limit: 20,
    });

    if (!rpcError && Array.isArray(rpcData)) {
      claimedPosts = rpcData as ClaimedPost[];
    } else {
      // Direct fallback if RPC is pending
      const nowIso = new Date().toISOString();
      const { data: duePosts } = await supabase
        .from('campaign_posts')
        .select('*')
        .eq('status', 'scheduled')
        .lte('scheduled_at', nowIso)
        .order('scheduled_at', { ascending: true })
        .limit(20);

      if (duePosts && duePosts.length > 0) {
        const postIds = duePosts.map((p) => p.id);
        await supabase
          .from('campaign_posts')
          .update({ status: 'publishing', updated_at: nowIso })
          .in('id', postIds);

        claimedPosts = duePosts as ClaimedPost[];
      }
    }

    if (claimedPosts.length === 0) {
      return NextResponse.json({
        message: 'No scheduled posts due for publishing.',
        processed: 0,
        successful: 0,
        failed: 0,
        results: [],
      });
    }

    // 3. Process each claimed post
    const results: Array<{
      postId: string;
      platform: string;
      status: 'published' | 'failed';
      externalPostId?: string;
      error?: string;
    }> = [];

    for (const post of claimedPosts) {
      try {
        let socialAccount: SocialAccount | null = null;
        if (post.social_account_id) {
          const { data: sa } = await supabase
            .from('social_accounts')
            .select('*')
            .eq('id', post.social_account_id)
            .maybeSingle();

          if (sa) socialAccount = sa as SocialAccount;
        }

        const mediaUrls = Array.isArray(post.media_urls)
          ? post.media_urls
          : [];

        const publishResult = await dispatchSocialPost({
          id: post.id,
          platform: post.platform,
          content: post.content,
          hashtags: post.hashtags ?? [],
          mediaUrls,
          socialAccount,
        });

        const nowIso = new Date().toISOString();

        if (publishResult.success) {
          // Update post to published
          await supabase
            .from('campaign_posts')
            .update({
              status: 'published',
              published_at: publishResult.publishedAt || nowIso,
              external_post_id: publishResult.externalPostId,
              error_message: null,
              scheduled_at: null,
              updated_at: nowIso,
            })
            .eq('id', post.id);

          results.push({
            postId: post.id,
            platform: post.platform,
            status: 'published',
            externalPostId: publishResult.externalPostId,
          });
        } else {
          // Update post to failed
          await supabase
            .from('campaign_posts')
            .update({
              status: 'failed',
              error_message: publishResult.error || 'Failed to dispatch post',
              updated_at: nowIso,
            })
            .eq('id', post.id);

          results.push({
            postId: post.id,
            platform: post.platform,
            status: 'failed',
            error: publishResult.error,
          });
        }
      } catch (postErr: any) {
        console.error(`Error executing scheduled post ${post.id}:`, postErr);
        await supabase
          .from('campaign_posts')
          .update({
            status: 'failed',
            error_message: postErr?.message || 'Unexpected worker failure',
            updated_at: new Date().toISOString(),
          })
          .eq('id', post.id);

        results.push({
          postId: post.id,
          platform: post.platform,
          status: 'failed',
          error: postErr?.message,
        });
      }
    }

    const successfulCount = results.filter((r) => r.status === 'published').length;
    const failedCount = results.filter((r) => r.status === 'failed').length;

    return NextResponse.json({
      message: `Processed ${claimedPosts.length} due scheduled posts.`,
      processed: claimedPosts.length,
      successful: successfulCount,
      failed: failedCount,
      results,
    });
  } catch (err: any) {
    console.error('Scheduled posts worker error:', err);
    return NextResponse.json(
      { error: err?.message || 'Scheduled posts worker encountered an error.' },
      { status: 500 }
    );
  }
}
