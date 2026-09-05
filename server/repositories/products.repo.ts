import type { SupabaseClient } from '@supabase/supabase-js';
import type { Product, ProductStatus, ProductSource } from '@/types/database';

export interface ProductFilters {
  search?: string;
  status?: ProductStatus | 'all';
  source?: ProductSource | 'all';
}

export class ProductsRepository {
  constructor(private supabase: SupabaseClient) {}

  async list(orgId: string, filters: ProductFilters = {}): Promise<Product[]> {
    let query = this.supabase
      .from('products')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,category.ilike.%${filters.search}%`
      );
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.source && filters.source !== 'all') {
      query = query.eq('source', filters.source);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Product[];
  }

  async getById(id: string, orgId: string): Promise<Product | null> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (error) throw error;
    return data as Product | null;
  }

  async create(product: Partial<Product> & { organization_id: string; name: string }): Promise<Product> {
    const { data, error } = await this.supabase
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  }

  async update(id: string, orgId: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await this.supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  }

  async delete(id: string, orgId: string): Promise<void> {
    const { error } = await this.supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) throw error;
  }
}
