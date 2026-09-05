import { NextRequest } from 'next/server';
import { getAuthenticatedOrg } from '@/server/http/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/server/http/response';
import { OrganizationService } from '@/server/services/organization.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get('orgId');

    const { context, error } = await getAuthenticatedOrg(orgIdParam);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    const service = new OrganizationService(context.supabase);
    const brand = await service.getBrand(context.orgId);

    return apiSuccess(brand);
  } catch (err: any) {
    console.error('API /api/organization/brand GET error:', err);
    return apiError(err?.message || 'Failed to fetch brand');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, ...brandInput } = body;

    const { context, error } = await getAuthenticatedOrg(orgId);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    const service = new OrganizationService(context.supabase);
    const brand = await service.upsertBrand(context.orgId, brandInput);

    return apiSuccess(brand);
  } catch (err: any) {
    console.error('API /api/organization/brand PUT error:', err);
    return apiError(err?.message || 'Failed to update brand');
  }
}
