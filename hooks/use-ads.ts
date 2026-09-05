'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adsApi, AdFilters } from '@/lib/api-client/ads.api';
import { campaignsApi } from '@/lib/api-client/campaigns.api';
import { useOrganization } from '@/hooks/use-organization';
import type { CampaignAd, AdPlatform, AdStatus, AdObjective, BidStrategy, Campaign } from '@/types/database';

export type { AdFilters };

export function useAds(filters: AdFilters = {}) {
  const { data: userOrg } = useOrganization();

  return useQuery<CampaignAd[]>({
    queryKey: ['campaign-ads', userOrg?.org.id, filters],
    queryFn: async () => {
      if (!userOrg?.org.id) return [];
      return adsApi.list(userOrg.org.id, filters);
    },
    enabled: !!userOrg?.org.id,
  });
}

export function useAdsByCampaign(campaignId?: string) {
  return useAds({ campaignId });
}

export interface CreateAdInput {
  campaignId: string;
  platform: AdPlatform;
  objective: AdObjective;
  dailyBudget?: number;
  lifetimeBudget?: number;
  bidStrategy?: BidStrategy;
  adAccountId?: string;
  creative: {
    headline?: string;
    primaryText?: string;
    description?: string;
    cta?: string;
    mediaUrls?: string[];
  };
  audience?: {
    ageMin?: number;
    ageMax?: number;
    genders?: string[];
    locations?: string[];
    languages?: string[];
    interests?: string[];
  };
}

export function useCreateAd() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreateAdInput) => {
      if (!userOrg?.org.id) throw new Error('No organization found');
      return adsApi.create({
        orgId: userOrg.org.id,
        campaign_id: input.campaignId,
        platform: input.platform,
        objective: input.objective,
        daily_budget: input.dailyBudget,
        lifetime_budget: input.lifetimeBudget,
        bid_strategy: input.bidStrategy,
        creative: input.creative,
        audience: input.audience,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-ads'] });
    },
  });
}

export function useUpdateAd() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      dailyBudget,
      lifetimeBudget,
      bidStrategy,
      creative,
      audience,
      objective,
    }: {
      id: string;
      status?: AdStatus;
      dailyBudget?: number;
      lifetimeBudget?: number;
      bidStrategy?: BidStrategy;
      creative?: CreateAdInput['creative'];
      audience?: CreateAdInput['audience'];
      objective?: AdObjective;
    }) => {
      if (!userOrg?.org.id) throw new Error('No organization found');
      const updates: any = {};
      if (status !== undefined) updates.status = status;
      if (dailyBudget !== undefined) updates.daily_budget = dailyBudget;
      if (lifetimeBudget !== undefined) updates.lifetime_budget = lifetimeBudget;
      if (bidStrategy !== undefined) updates.bid_strategy = bidStrategy;
      if (creative !== undefined) updates.creative = creative;
      if (audience !== undefined) updates.audience = audience;
      if (objective !== undefined) updates.objective = objective;

      return adsApi.update(id, userOrg.org.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-ads'] });
    },
  });
}

export function useDeleteAd() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!userOrg?.org.id) throw new Error('No organization found');
      await adsApi.delete(id, userOrg.org.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-ads'] });
    },
  });
}

export function usePaidCampaigns() {
  const { data: userOrg } = useOrganization();

  return useQuery<Campaign[]>({
    queryKey: ['campaigns-paid', userOrg?.org.id],
    queryFn: async () => {
      if (!userOrg?.org.id) return [];
      return campaignsApi.list(userOrg.org.id);
    },
    enabled: !!userOrg?.org.id,
  });
}

export function useLaunchAd() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (adId: string) => {
      if (!userOrg?.org.id) throw new Error('No organization found');
      return adsApi.launch(adId, userOrg.org.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-ads'] });
    },
  });
}
