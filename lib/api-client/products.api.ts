import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Product, ProductStatus, ProductSource } from '@/types/database';

export interface ProductFilters {
  search?: string;
  status?: ProductStatus | 'all';
  source?: ProductSource | 'all';
}

export const productsApi = {
  list: (orgId: string, filters: ProductFilters = {}) =>
    apiGet<Product[]>('/api/products', { orgId, ...filters }),

  getById: (id: string, orgId: string) =>
    apiGet<Product>(`/api/products/${id}`, { orgId }),

  create: (data: {
    orgId: string;
    name: string;
    description?: string;
    category?: string;
    price?: number;
    compare_at_price?: number;
    images?: string[];
    source?: string;
    source_url?: string;
    sku?: string;
    barcode?: string;
  }) => apiPost<Product>('/api/products', data),

  update: (id: string, orgId: string, updates: Partial<Product>) =>
    apiPut<Product>(`/api/products/${id}`, { orgId, ...updates }),

  delete: (id: string, orgId: string) =>
    apiDelete<{ deleted: boolean }>(`/api/products/${id}`, { orgId }),
};
