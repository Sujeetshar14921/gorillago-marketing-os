import type { SupabaseClient } from '@supabase/supabase-js';
import type { ContentGeneration, ContentType } from '@/types/database';

export interface ContentFilters {
  type?: ContentType | 'all';
  search?: string;
}

export class ContentRepository {
  constructor(private supabase: SupabaseClient) {}

  async list(orgId: string, filters: ContentFilters = {}): Promise<ContentGeneration[]> {
    let query = this.supabase
      .from('content_generations')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (filters.type && filters.type !== 'all') {
      query = query.eq('type', filters.type);
    }

    if (filters.search) {
      query = query.or(`prompt.ilike.%${filters.search}%,generated_content.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as ContentGeneration[];
  }

  async getById(id: string, orgId: string): Promise<ContentGeneration | null> {
    const { data, error } = await this.supabase
      .from('content_generations')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (error) throw error;
    return data as ContentGeneration | null;
  }

  async create(record: Partial<ContentGeneration> & { organization_id: string; prompt: string; generated_content: string }): Promise<ContentGeneration> {
    const { data, error } = await this.supabase
      .from('content_generations')
      .insert(record)
      .select()
      .single();

    if (error) throw error;
    return data as ContentGeneration;
  }

  async update(id: string, orgId: string, updates: Partial<ContentGeneration>): Promise<ContentGeneration> {
    const { data, error } = await this.supabase
      .from('content_generations')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return data as ContentGeneration;
  }

  async delete(id: string, orgId: string): Promise<void> {
    const { error } = await this.supabase
      .from('content_generations')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) throw error;
  }
}
