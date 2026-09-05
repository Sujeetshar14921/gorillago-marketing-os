'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/hooks/use-organization';
import { analyticsApi, AnalyticsDateRange } from '@/lib/api-client/analytics.api';
import type { AnalyticsSnapshot } from '@/types/database';

export type { AnalyticsDateRange };

export function useAnalyticsSnapshots(range: AnalyticsDateRange) {
  const { data: userOrg } = useOrganization();

  return useQuery<AnalyticsSnapshot[]>({
    queryKey: ['analytics-snapshots', userOrg?.org.id, range],
    queryFn: async () => {
      if (!userOrg?.org.id) return [];
      return analyticsApi.getSnapshots(userOrg.org.id, range, 'organization');
    },
    enabled: !!userOrg?.org.id,
  });
}

export function usePlatformAnalytics(range: AnalyticsDateRange) {
  const { data: userOrg } = useOrganization();

  return useQuery<AnalyticsSnapshot[]>({
    queryKey: ['analytics-platform', userOrg?.org.id, range],
    queryFn: async () => {
      if (!userOrg?.org.id) return [];
      return analyticsApi.getSnapshots(userOrg.org.id, range, 'social_account');
    },
    enabled: !!userOrg?.org.id,
  });
}

export function useLatestAiInsight() {
  const { data: userOrg } = useOrganization();

  return useQuery<string | null>({
    queryKey: ['analytics-latest-insight', userOrg?.org.id],
    queryFn: async () => {
      if (!userOrg?.org.id) return null;
      const res = await analyticsApi.getLatestAiInsight(userOrg.org.id);
      return res.aiSuggestion ?? null;
    },
    enabled: !!userOrg?.org.id,
  });
}

/**
 * Triggers live performance metrics synchronization across connected channels & campaigns
 */
export function useSyncLiveAnalytics() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (days: number = 30) => {
      if (!userOrg?.org.id) throw new Error('No organization found');

      const res = await fetch('/api/analytics/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: userOrg.org.id,
          days,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Analytics sync failed');
      }

      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics-snapshots'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-platform'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-latest-insight'] });
    },
  });
}
