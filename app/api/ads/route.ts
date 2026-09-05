import { NextRequest } from 'next/server';
import { getAuthenticatedOrg } from '@/server/http/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/server/http/response';
import { AdsService } from '@/server/services/ads.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get('orgId');
    const campaignId = searchParams.get('campaignId') || undefined;
    const platform = searchParams.get('platform') || undefined;
    const status = searchParams.get('status') || undefined;

    const { context, error } = await getAuthenticatedOrg(orgIdParam);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    const service = new AdsService(context.supabase);
    const ads = await service.getAds(context.orgId, {
      campaignId,
      platform: platform as any,
      status: status as any,
    });

    return apiSuccess(ads);
  } catch (err: any) {
    console.error('API /api/ads GET error:', err);
    return apiError(err?.message || 'Failed to fetch ads');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, ...adData } = body;

    const { context, error } = await getAuthenticatedOrg(orgId);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    const service = new AdsService(context.supabase);
    const ad = await service.createAd(context.orgId, context.user.id, adData);

    return apiSuccess(ad, 201);
  } catch (err: any) {
    console.error('API /api/ads POST error:', err);
    return apiError(err?.message || 'Failed to create ad');
  }
}
