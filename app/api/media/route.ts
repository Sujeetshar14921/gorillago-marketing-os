import { NextRequest } from 'next/server';
import { getAuthenticatedOrg } from '@/server/http/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/server/http/response';
import { MediaService } from '@/server/services/media.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get('orgId');
    const category = searchParams.get('category') || undefined;
    const type = searchParams.get('type') || undefined;
    const search = searchParams.get('search') || undefined;

    const { context, error } = await getAuthenticatedOrg(orgIdParam);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    const service = new MediaService(context.supabase);
    const assets = await service.getMediaAssets(context.orgId, {
      category: category as any,
      type: type as any,
      search,
    });

    return apiSuccess(assets);
  } catch (err: any) {
    console.error('API /api/media GET error:', err);
    return apiError(err?.message || 'Failed to fetch media assets');
  }
}
