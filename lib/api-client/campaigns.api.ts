import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Campaign, CampaignStatus, CampaignObjective } from '@/types/database';

export interface CampaignFilters {
  status?: CampaignStatus | 'all';
  objective?: CampaignObjective | 'all';
  type?: string;
  search?: string;
}

export const campaignsApi = {
  list: (orgId: string, filters: CampaignFilters = {}) =>
    apiGet<Campaign[]>('/api/campaigns', { orgId, ...filters }),

  getById: (id: string, orgId: string) =>
    apiGet<Campaign>(`/api/campaigns/${id}`, { orgId }),

  create: (data: {
    orgId: string;
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
  }) => apiPost<Campaign>('/api/campaigns', data),

  update: (id: string, orgId: string, updates: Partial<Campaign>) =>
    apiPut<Campaign>(`/api/campaigns/${id}`, { orgId, ...updates }),

  delete: (id: string, orgId: string) =>
    apiDelete<{ deleted: boolean }>(`/api/campaigns/${id}`, { orgId }),
};
