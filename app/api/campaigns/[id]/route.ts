import { NextRequest } from 'next/server';
import { getAuthenticatedOrg } from '@/server/http/auth';
import { apiSuccess, apiError, apiUnauthorized, apiNotFound } from '@/server/http/response';
import { CampaignsService } from '@/server/services/campaigns.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get('orgId');

    const { context, error } = await getAuthenticatedOrg(orgIdParam);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    const service = new CampaignsService(context.supabase);
    const campaign = await service.getCampaignById(params.id, context.orgId);
    if (!campaign) {
      return apiNotFound('Campaign not found');
    }

    return apiSuccess(campaign);
  } catch (err: any) {
    console.error('API /api/campaigns/[id] GET error:', err);
    return apiError(err?.message || 'Failed to fetch campaign');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { orgId, ...updates } = body;

    const { context, error } = await getAuthenticatedOrg(orgId);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    const service = new CampaignsService(context.supabase);
    const updated = await service.updateCampaign(params.id, context.orgId, updates);

    return apiSuccess(updated);
  } catch (err: any) {
    console.error('API /api/campaigns/[id] PUT error:', err);
    return apiError(err?.message || 'Failed to update campaign');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get('orgId');

    const { context, error } = await getAuthenticatedOrg(orgIdParam);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    const service = new CampaignsService(context.supabase);
    await service.deleteCampaign(params.id, context.orgId);

    return apiSuccess({ deleted: true });
  } catch (err: any) {
    console.error('API /api/campaigns/[id] DELETE error:', err);
    return apiError(err?.message || 'Failed to delete campaign');
  }
}
