import { NextRequest } from 'next/server';
import { getAuthenticatedOrg } from '@/server/http/auth';
import { apiSuccess, apiError, apiUnauthorized, apiNotFound } from '@/server/http/response';
import { ProductsService } from '@/server/services/products.service';

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

    const service = new ProductsService(context.supabase);
    const product = await service.getProductById(params.id, context.orgId);
    if (!product) {
      return apiNotFound('Product not found');
    }

    return apiSuccess(product);
  } catch (err: any) {
    console.error('API /api/products/[id] GET error:', err);
    return apiError(err?.message || 'Failed to fetch product');
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

    const service = new ProductsService(context.supabase);
    const updated = await service.updateProduct(params.id, context.orgId, updates);

    return apiSuccess(updated);
  } catch (err: any) {
    console.error('API /api/products/[id] PUT error:', err);
    return apiError(err?.message || 'Failed to update product');
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

    const service = new ProductsService(context.supabase);
    await service.deleteProduct(params.id, context.orgId);

    return apiSuccess({ deleted: true });
  } catch (err: any) {
    console.error('API /api/products/[id] DELETE error:', err);
    return apiError(err?.message || 'Failed to delete product');
  }
}
