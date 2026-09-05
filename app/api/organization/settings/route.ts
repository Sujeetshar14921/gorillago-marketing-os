import { NextRequest } from 'next/server';
import { getAuthenticatedOrg } from '@/server/http/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/server/http/response';
import { OrganizationService } from '@/server/services/organization.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get('orgId');

    const { context, error } = await getAuthenticatedOrg(orgIdParam);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    const service = new OrganizationService(context.supabase);
    const settings = await service.getSettings(context.orgId);

    return apiSuccess(settings);
  } catch (err: any) {
    console.error('API /api/organization/settings GET error:', err);
    return apiError(err?.message || 'Failed to fetch settings');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, ...updates } = body;

    const { context, error } = await getAuthenticatedOrg(orgId);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    const service = new OrganizationService(context.supabase);
    const updated = await service.updateSettings(context.orgId, updates);

    return apiSuccess(updated);
  } catch (err: any) {
    console.error('API /api/organization/settings PUT error:', err);
    return apiError(err?.message || 'Failed to update settings');
  }
}
