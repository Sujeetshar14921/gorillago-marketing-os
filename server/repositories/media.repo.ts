import type { SupabaseClient } from '@supabase/supabase-js';
import type { MediaAsset, MediaCategory } from '@/types/database';

export interface MediaFilters {
  category?: MediaCategory | 'all';
  search?: string;
  type?: 'image' | 'video';
}

export class MediaRepository {
  constructor(private supabase: SupabaseClient) {}

  async list(orgId: string, filters: MediaFilters = {}): Promise<MediaAsset[]> {
    let query = this.supabase
      .from('media_assets')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.search) {
      query = query.or(`ai_prompt.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as MediaAsset[];
  }

  async getById(id: string, orgId: string): Promise<MediaAsset | null> {
    const { data, error } = await this.supabase
      .from('media_assets')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (error) throw error;
    return data as MediaAsset | null;
  }

  async create(asset: Partial<MediaAsset> & { organization_id: string; url: string; type: 'image' | 'video' }): Promise<MediaAsset> {
    const { data, error } = await this.supabase
      .from('media_assets')
      .insert(asset)
      .select()
      .single();

    if (error) throw error;
    return data as MediaAsset;
  }

  async delete(id: string, orgId: string): Promise<void> {
    const { error } = await this.supabase
      .from('media_assets')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) throw error;
  }
}
