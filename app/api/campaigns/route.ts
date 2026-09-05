import { NextRequest } from 'next/server';
import { getAuthenticatedOrg } from '@/server/http/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/server/http/response';
import { CampaignsService } from '@/server/services/campaigns.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get('orgId');
    const status = searchParams.get('status') || undefined;
    const objective = searchParams.get('objective') || undefined;
    const search = searchParams.get('search') || undefined;

    const { context, error } = await getAuthenticatedOrg(orgIdParam);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    const service = new CampaignsService(context.supabase);
    const campaigns = await service.getCampaigns(context.orgId, {
      status: status as any,
      objective: objective as any,
      search,
    });

    return apiSuccess(campaigns);
  } catch (err: any) {
    console.error('API /api/campaigns GET error:', err);
    return apiError(err?.message || 'Failed to fetch campaigns');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, ...campaignData } = body;

    const { context, error } = await getAuthenticatedOrg(orgId);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    const service = new CampaignsService(context.supabase);
    const campaign = await service.createCampaign(context.orgId, context.user.id, campaignData);

    return apiSuccess(campaign, 201);
  } catch (err: any) {
    console.error('API /api/campaigns POST error:', err);
    return apiError(err?.message || 'Failed to create campaign');
  }
}
