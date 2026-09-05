import type { SupabaseClient } from '@supabase/supabase-js';
import { CampaignsRepository, CampaignFilters } from '../repositories/campaigns.repo';
import type { Campaign } from '@/types/database';

export class CampaignsService {
  private repo: CampaignsRepository;

  constructor(supabase: SupabaseClient) {
    this.repo = new CampaignsRepository(supabase);
  }

  async getCampaigns(orgId: string, filters: CampaignFilters = {}): Promise<Campaign[]> {
    return this.repo.list(orgId, filters);
  }

  async getCampaignById(id: string, orgId: string): Promise<Campaign | null> {
    return this.repo.getById(id, orgId);
  }

  async createCampaign(orgId: string, userId: string, data: {
    name: string;
    description?: string;
    objective?: string;
    daily_budget?: number;
    total_budget?: number;
    start_date?: string;
    end_date?: string;
    target_audience?: Record<string, any>;
    channels?: string[];
    product_id?: string;
  }): Promise<Campaign> {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Campaign name is required');
    }

    return this.repo.create({
      organization_id: orgId,
      created_by: userId,
      name: data.name.trim(),
      type: 'paid',
      goal: (data.objective as any) || 'sales',
      status: 'draft',
      budget: data.daily_budget !== undefined ? Number(data.daily_budget) : (data.total_budget !== undefined ? Number(data.total_budget) : null),
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      product_id: data.product_id || null,
      metadata: {
        description: data.description,
        target_audience: data.target_audience,
        channels: data.channels,
      },
    });
  }

  async updateCampaign(id: string, orgId: string, updates: Partial<Campaign>): Promise<Campaign> {
    const existing = await this.repo.getById(id, orgId);
    if (!existing) {
      throw new Error('Campaign not found or access denied');
    }
    return this.repo.update(id, orgId, updates);
  }

  async deleteCampaign(id: string, orgId: string): Promise<void> {
    const existing = await this.repo.getById(id, orgId);
    if (!existing) {
      throw new Error('Campaign not found or access denied');
    }
    await this.repo.delete(id, orgId);
  }
}
