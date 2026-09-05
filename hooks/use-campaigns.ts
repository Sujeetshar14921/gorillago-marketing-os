'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsApi, CampaignFilters } from '@/lib/api-client/campaigns.api';
import { useOrganization } from '@/hooks/use-organization';
import type { Campaign, CampaignType, CampaignGoal, CampaignStatus } from '@/types/database';

export type { CampaignFilters };

export function useCampaigns(filters: CampaignFilters = {}) {
  const { data: userOrg } = useOrganization();

  return useQuery<Campaign[]>({
    queryKey: ['campaigns', userOrg?.org.id, filters],
    queryFn: async () => {
      if (!userOrg?.org.id) return [];
      return campaignsApi.list(userOrg.org.id, filters);
    },
    enabled: !!userOrg?.org.id,
  });
}

export function useCampaign(campaignId: string | undefined) {
  const { data: userOrg } = useOrganization();

  return useQuery<Campaign | null>({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      if (!campaignId || !userOrg?.org.id) return null;
      return campaignsApi.getById(campaignId, userOrg.org.id);
    },
    enabled: !!campaignId && !!userOrg?.org.id,
  });
}

export interface CreateCampaignInput {
  name: string;
  type?: CampaignType;
  goal?: CampaignGoal;
  productId?: string;
  startDate?: string;
  endDate?: string;
  dailyBudget?: number;
  totalBudget?: number;
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreateCampaignInput) => {
      if (!userOrg?.org.id) throw new Error('No organization found');
      return campaignsApi.create({
        orgId: userOrg.org.id,
        name: input.name,
        objective: input.goal || 'sales',
        product_id: input.productId,
        start_date: input.startDate,
        end_date: input.endDate,
        daily_budget: input.dailyBudget,
        total_budget: input.totalBudget,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!userOrg?.org.id) throw new Error('No organization found');
      await campaignsApi.delete(id, userOrg.org.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-posts'] });
    },
  });
}
