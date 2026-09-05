import type { SupabaseClient } from '@supabase/supabase-js';
import { ProductsRepository, ProductFilters } from '../repositories/products.repo';
import type { Product } from '@/types/database';

export class ProductsService {
  private repo: ProductsRepository;

  constructor(supabase: SupabaseClient) {
    this.repo = new ProductsRepository(supabase);
  }

  async getProducts(orgId: string, filters: ProductFilters = {}): Promise<Product[]> {
    return this.repo.list(orgId, filters);
  }

  async getProductById(id: string, orgId: string): Promise<Product | null> {
    return this.repo.getById(id, orgId);
  }

  async createProduct(orgId: string, data: {
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
  }): Promise<Product> {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Product name is required');
    }

    return this.repo.create({
      organization_id: orgId,
      name: data.name.trim(),
      description: data.description || null,
      category: data.category || 'general',
      price: data.price !== undefined ? Number(data.price) : null,
      compare_at_price: data.compare_at_price !== undefined ? Number(data.compare_at_price) : null,
      images: data.images || [],
      source: (data.source as any) || 'manual',
      source_url: data.source_url || null,
      sku: data.sku || null,
      barcode: data.barcode || null,
      status: 'active',
    });
  }

  async updateProduct(id: string, orgId: string, updates: Partial<Product>): Promise<Product> {
    const existing = await this.repo.getById(id, orgId);
    if (!existing) {
      throw new Error('Product not found or access denied');
    }
    return this.repo.update(id, orgId, updates);
  }

  async deleteProduct(id: string, orgId: string): Promise<void> {
    const existing = await this.repo.getById(id, orgId);
    if (!existing) {
      throw new Error('Product not found or access denied');
    }
    await this.repo.delete(id, orgId);
  }
}
