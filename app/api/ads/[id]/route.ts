import { NextRequest } from 'next/server';
import { getAuthenticatedOrg } from '@/server/http/auth';
import { apiSuccess, apiError, apiUnauthorized, apiNotFound } from '@/server/http/response';
import { AdsService } from '@/server/services/ads.service';

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

    const service = new AdsService(context.supabase);
    const ad = await service.getAdById(params.id, context.orgId);
    if (!ad) {
      return apiNotFound('Ad not found');
    }

    return apiSuccess(ad);
  } catch (err: any) {
    console.error('API /api/ads/[id] GET error:', err);
    return apiError(err?.message || 'Failed to fetch ad');
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

    const service = new AdsService(context.supabase);
    const updated = await service.updateAd(params.id, context.orgId, updates);

    return apiSuccess(updated);
  } catch (err: any) {
    console.error('API /api/ads/[id] PUT error:', err);
    return apiError(err?.message || 'Failed to update ad');
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

    const service = new AdsService(context.supabase);
    await service.deleteAd(params.id, context.orgId);

    return apiSuccess({ deleted: true });
  } catch (err: any) {
    console.error('API /api/ads/[id] DELETE error:', err);
    return apiError(err?.message || 'Failed to delete ad');
  }
}
