'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, ProductFilters } from '@/lib/api-client/products.api';
import { useOrganization } from '@/hooks/use-organization';
import type { Product, ProductStatus, ProductSource, InventoryStatus } from '@/types/database';

export type { ProductFilters };

export function useProducts(filters: ProductFilters = {}) {
  const { data: userOrg } = useOrganization();

  return useQuery<Product[]>({
    queryKey: ['products', userOrg?.org.id, filters],
    queryFn: async () => {
      if (!userOrg?.org.id) return [];
      return productsApi.list(userOrg.org.id, filters);
    },
    enabled: !!userOrg?.org.id,
  });
}

export function useProduct(productId: string | undefined) {
  const { data: userOrg } = useOrganization();

  return useQuery<Product | null>({
    queryKey: ['product', productId],
    queryFn: async () => {
      if (!productId || !userOrg?.org.id) return null;
      return productsApi.getById(productId, userOrg.org.id);
    },
    enabled: !!productId && !!userOrg?.org.id,
  });
}

export interface CreateProductInput {
  name: string;
  description?: string;
  category?: string;
  subcategory?: string;
  price?: number;
  compare_at_price?: number;
  currency?: string;
  sku?: string;
  barcode?: string;
  status?: ProductStatus;
  source?: ProductSource;
  source_url?: string;
  images?: string[];
  tags?: string[];
  inventory_count?: number;
  inventory_status?: string;
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreateProductInput) => {
      if (!userOrg?.org.id) throw new Error('No organization found');
      return productsApi.create({
        orgId: userOrg.org.id,
        ...input,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export interface UpdateProductInput {
  name?: string;
  description?: string | null;
  category?: string | null;
  subcategory?: string | null;
  price?: number | null;
  compare_at_price?: number | null;
  currency?: string;
  sku?: string | null;
  barcode?: string | null;
  status?: ProductStatus;
  source_url?: string | null;
  images?: string[];
  videos?: string[];
  tags?: string[];
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string[];
  inventory_count?: number;
  inventory_status?: InventoryStatus;
}

export function useUpdateProduct(productId: string) {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (input: UpdateProductInput) => {
      if (!userOrg?.org.id) throw new Error('No organization found');
      return productsApi.update(productId, userOrg.org.id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!userOrg?.org.id) throw new Error('No organization found');
      await productsApi.delete(productId, userOrg.org.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
