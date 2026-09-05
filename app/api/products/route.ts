import { NextRequest } from 'next/server';
import { getAuthenticatedOrg } from '@/server/http/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/server/http/response';
import { ProductsService } from '@/server/services/products.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get('orgId');
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const source = searchParams.get('source') || undefined;

    const { context, error, status: authStatus } = await getAuthenticatedOrg(orgIdParam);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    const service = new ProductsService(context.supabase);
    const products = await service.getProducts(context.orgId, {
      search,
      status: status as any,
      source: source as any,
    });

    return apiSuccess(products);
  } catch (err: any) {
    console.error('API /api/products GET error:', err);
    return apiError(err?.message || 'Failed to fetch products');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, ...productData } = body;

    const { context, error } = await getAuthenticatedOrg(orgId);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    const service = new ProductsService(context.supabase);
    const product = await service.createProduct(context.orgId, productData);

    return apiSuccess(product, 201);
  } catch (err: any) {
    console.error('API /api/products POST error:', err);
    return apiError(err?.message || 'Failed to create product');
  }
}
