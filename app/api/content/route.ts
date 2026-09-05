import { NextRequest } from 'next/server';
import { getAuthenticatedOrg } from '@/server/http/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/server/http/response';
import { ContentService } from '@/server/services/content.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get('orgId');
    const type = searchParams.get('type') || undefined;
    const search = searchParams.get('search') || undefined;

    const { context, error } = await getAuthenticatedOrg(orgIdParam);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    const service = new ContentService(context.supabase);
    const content = await service.getContentList(context.orgId, {
      type: type as any,
      search,
    });

    return apiSuccess(content);
  } catch (err: any) {
    console.error('API /api/content GET error:', err);
    return apiError(err?.message || 'Failed to fetch content generations');
  }
}
