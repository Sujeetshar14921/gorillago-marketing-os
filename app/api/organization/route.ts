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
    const org = await service.getOrganization(context.orgId);

    return apiSuccess({
      org,
      role: context.role,
    });
  } catch (err: any) {
    console.error('API /api/organization GET error:', err);
    return apiError(err?.message || 'Failed to fetch organization');
  }
}
