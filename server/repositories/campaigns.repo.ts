import type { SupabaseClient } from '@supabase/supabase-js';
import type { Campaign, CampaignStatus, CampaignObjective } from '@/types/database';

export interface CampaignFilters {
  status?: CampaignStatus | 'all';
  objective?: CampaignObjective | 'all';
  type?: string;
  search?: string;
}

export class CampaignsRepository {
  constructor(private supabase: SupabaseClient) {}

  async list(orgId: string, filters: CampaignFilters = {}): Promise<Campaign[]> {
    let query = this.supabase
      .from('campaigns')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.objective && filters.objective !== 'all') {
      query = query.eq('goal', filters.objective);
    }

    if (filters.type && filters.type !== 'all') {
      query = query.eq('type', filters.type);
    }

    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Campaign[];
  }

  async getById(id: string, orgId: string): Promise<Campaign | null> {
    const { data, error } = await this.supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (error) throw error;
    return data as Campaign | null;
  }

  async create(campaign: Partial<Campaign> & { organization_id: string; name: string }): Promise<Campaign> {
    const { data, error } = await this.supabase
      .from('campaigns')
      .insert(campaign)
      .select()
      .single();

    if (error) throw error;
    return data as Campaign;
  }

  async update(id: string, orgId: string, updates: Partial<Campaign>): Promise<Campaign> {
    const { data, error } = await this.supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return data as Campaign;
  }

  async delete(id: string, orgId: string): Promise<void> {
    const { error } = await this.supabase
      .from('campaigns')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) throw error;
  }
}
