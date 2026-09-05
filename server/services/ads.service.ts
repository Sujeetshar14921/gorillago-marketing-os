import type { SupabaseClient } from '@supabase/supabase-js';
import { AdsRepository, AdFilters } from '../repositories/ads.repo';
import { dispatchCustomerFeedAd } from '@/lib/ads/engine';
import type { CampaignAd, AdPlatform, AdObjective, BidStrategy } from '@/types/database';

export class AdsService {
  private repo: AdsRepository;

  constructor(private supabase: SupabaseClient) {
    this.repo = new AdsRepository(supabase);
  }

  async getAds(orgId: string, filters: AdFilters = {}): Promise<CampaignAd[]> {
    return this.repo.list(orgId, filters);
  }

  async getAdById(id: string, orgId: string): Promise<CampaignAd | null> {
    return this.repo.getById(id, orgId);
  }

  async createAd(orgId: string, userId: string, data: {
    campaign_id: string;
    platform: AdPlatform;
    objective: AdObjective;
    daily_budget?: number;
    lifetime_budget?: number;
    bid_strategy?: BidStrategy;
    audience?: Record<string, any>;
    creative: Record<string, any>;
  }): Promise<CampaignAd> {
    if (!data.campaign_id) {
      throw new Error('Campaign ID is required');
    }
    if (!data.platform) {
      throw new Error('Ad platform is required');
    }

    return this.repo.create({
      organization_id: orgId,
      campaign_id: data.campaign_id,
      platform: data.platform,
      objective: data.objective || 'conversions',
      status: 'draft',
      daily_budget: data.daily_budget !== undefined ? Number(data.daily_budget) : null,
      lifetime_budget: data.lifetime_budget !== undefined ? Number(data.lifetime_budget) : null,
      bid_strategy: data.bid_strategy || 'lowest_cost',
      audience: data.audience || {},
      creative: data.creative || {},
      placements: [],
      created_by: userId,
    });
  }

  async updateAd(id: string, orgId: string, updates: Partial<CampaignAd>): Promise<CampaignAd> {
    const existing = await this.repo.getById(id, orgId);
    if (!existing) {
      throw new Error('Ad not found or access denied');
    }
    return this.repo.update(id, orgId, updates);
  }

  async deleteAd(id: string, orgId: string): Promise<void> {
    const existing = await this.repo.getById(id, orgId);
    if (!existing) {
      throw new Error('Ad not found or access denied');
    }
    await this.repo.delete(id, orgId);
  }

  async launchAd(id: string, orgId: string, userId: string) {
    const ad = await this.repo.getById(id, orgId);
    if (!ad) {
      throw new Error('Ad not found or access denied');
    }

    // Launch via Agency Master Ad API engine
    const launchResult = await dispatchCustomerFeedAd(ad);

    if (!launchResult.success) {
      await this.repo.update(id, orgId, {
        status: 'failed',
        error_message: launchResult.error || 'Failed to dispatch ad',
      });
      throw new Error(launchResult.error || 'Failed to dispatch ad');
    }

    // Update ad with active status and external ad ID
    const updatedAd = await this.repo.update(id, orgId, {
      status: 'active',
      external_ad_id: launchResult.externalAdId,
      approved_by: userId,
      approved_at: new Date().toISOString(),
      error_message: null,
    });

    return {
      ad: updatedAd,
      delivery: launchResult,
    };
  }
}
