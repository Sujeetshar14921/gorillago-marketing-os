import type { SupabaseClient } from '@supabase/supabase-js';
import type { CampaignAd, AdStatus, AdPlatform } from '@/types/database';

export interface AdFilters {
  campaignId?: string;
  platform?: AdPlatform | 'all';
  status?: AdStatus | 'all';
  search?: string;
}

export class AdsRepository {
  constructor(private supabase: SupabaseClient) {}

  async list(orgId: string, filters: AdFilters = {}): Promise<CampaignAd[]> {
    let query = this.supabase
      .from('campaign_ads')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (filters.campaignId) {
      query = query.eq('campaign_id', filters.campaignId);
    }

    if (filters.platform && filters.platform !== 'all') {
      query = query.eq('platform', filters.platform);
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.search) {
      query = query.or(`creative->>headline.ilike.%${filters.search}%,creative->>primaryText.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as CampaignAd[];
  }

  async getById(id: string, orgId: string): Promise<CampaignAd | null> {
    const { data, error } = await this.supabase
      .from('campaign_ads')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (error) throw error;
    return data as CampaignAd | null;
  }

  async create(ad: Partial<CampaignAd> & { organization_id: string; campaign_id: string }): Promise<CampaignAd> {
    const { data, error } = await this.supabase
      .from('campaign_ads')
      .insert(ad)
      .select()
      .single();

    if (error) throw error;
    return data as CampaignAd;
  }

  async update(id: string, orgId: string, updates: Partial<CampaignAd>): Promise<CampaignAd> {
    const { data, error } = await this.supabase
      .from('campaign_ads')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return data as CampaignAd;
  }

  async delete(id: string, orgId: string): Promise<void> {
    const { error } = await this.supabase
      .from('campaign_ads')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) throw error;
  }
}
