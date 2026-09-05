import { NextRequest } from 'next/server';
import { getAuthenticatedOrg } from '@/server/http/auth';
import { apiSuccess, apiError, apiUnauthorized, apiBadRequest } from '@/server/http/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get('orgId');
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
    const campaignId = searchParams.get('campaignId');
    const search = searchParams.get('search');

    const { context, error } = await getAuthenticatedOrg(orgIdParam);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    let query = context.supabase
      .from('campaign_posts')
      .select('*')
      .eq('organization_id', context.orgId)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (platform && platform !== 'all') {
      query = query.eq('platform', platform);
    }
    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }
    if (search) {
      query = query.ilike('content', `%${search}%`);
    }

    const { data, error: dbError } = await query;
    if (dbError) throw dbError;

    return apiSuccess(data ?? []);
  } catch (err: any) {
    console.error('API /api/posts GET error:', err);
    return apiError(err?.message || 'Failed to fetch posts');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, ...postData } = body;

    const { context, error } = await getAuthenticatedOrg(orgId);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    const { data, error: insertError } = await context.supabase
      .from('campaign_posts')
      .insert({
        organization_id: context.orgId,
        campaign_id: postData.campaignId,
        social_account_id: postData.socialAccountId ?? null,
        platform: postData.platform,
        content: postData.content,
        hashtags: postData.hashtags ?? [],
        media_urls: postData.mediaUrls ?? [],
        status: postData.status ?? 'draft',
        scheduled_at: postData.scheduledAt ?? null,
        created_by: context.userId,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return apiSuccess(data);
  } catch (err: any) {
    console.error('API /api/posts POST error:', err);
    return apiError(err?.message || 'Failed to create post');
  }
}
