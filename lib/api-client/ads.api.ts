import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { CampaignAd, AdStatus, AdPlatform, AdObjective, BidStrategy } from '@/types/database';

export interface AdFilters {
  campaignId?: string;
  platform?: AdPlatform | 'all';
  status?: AdStatus | 'all';
  search?: string;
}

export const adsApi = {
  list: (orgId: string, filters: AdFilters = {}) =>
    apiGet<CampaignAd[]>('/api/ads', { orgId, ...filters }),

  getById: (id: string, orgId: string) =>
    apiGet<CampaignAd>(`/api/ads/${id}`, { orgId }),

  create: (data: {
    orgId: string;
    campaign_id: string;
    platform: AdPlatform;
    objective: AdObjective;
    daily_budget?: number;
    lifetime_budget?: number;
    bid_strategy?: BidStrategy;
    audience?: Record<string, any>;
    creative: Record<string, any>;
  }) => apiPost<CampaignAd>('/api/ads', data),

  update: (id: string, orgId: string, updates: Partial<CampaignAd>) =>
    apiPut<CampaignAd>(`/api/ads/${id}`, { orgId, ...updates }),

  delete: (id: string, orgId: string) =>
    apiDelete<{ deleted: boolean }>(`/api/ads/${id}`, { orgId }),

  launch: (id: string, orgId: string) =>
    apiPost<{ ad: CampaignAd; delivery: any }>('/api/ads/launch', { adId: id, organizationId: orgId }),
};
