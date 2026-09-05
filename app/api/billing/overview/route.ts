import { NextRequest } from 'next/server';
import { getAuthenticatedOrg } from '@/server/http/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/server/http/response';
import { BillingService } from '@/server/services/billing.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get('orgId');

    const { context, error } = await getAuthenticatedOrg(orgIdParam);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    const service = new BillingService(context.supabase);
    const overview = await service.getOverview(context.orgId);

    return apiSuccess(overview);
  } catch (err: any) {
    console.error('API /api/billing/overview GET error:', err);
    return apiError(err?.message || 'Failed to fetch billing overview');
  }
}
