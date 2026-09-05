'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/hooks/use-organization';
import type { Integration, IntegrationType } from '@/types/database';

export function useIntegrations() {
  const { data: userOrg } = useOrganization();

  return useQuery<Integration[]>({
    queryKey: ['integrations', userOrg?.org.id],
    queryFn: async () => {
      if (!userOrg?.org.id) return [];

      const res = await fetch(`/api/integrations?orgId=${encodeURIComponent(userOrg.org.id)}`);
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to fetch integrations');
      }
      return (json.data ?? []) as Integration[];
    },
    enabled: !!userOrg?.org.id,
  });
}

export function useManualConnectIntegration() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (params: {
      platform: IntegrationType;
      accountName: string;
      accountId?: string;
      accessToken?: string;
      isSandbox?: boolean;
    }) => {
      if (!userOrg?.org.id) throw new Error('Organization not loaded');

      const res = await fetch('/api/auth/oauth/manual-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: userOrg.org.id,
          platform: params.platform,
          accountName: params.accountName,
          accountId: params.accountId,
          accessToken: params.accessToken,
          isSandbox: params.isSandbox ?? false,
          type: 'ad',
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to connect integration');
      }

      return json.data as Integration;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
}

export function useDisconnectIntegration() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (params: { accountId: string; deletePermanently?: boolean }) => {
      if (!userOrg?.org.id) throw new Error('Organization not loaded');

      const res = await fetch('/api/auth/oauth/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: params.accountId,
          orgId: userOrg.org.id,
          type: 'integration',
          deletePermanently: params.deletePermanently ?? false,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to disconnect integration');
      }

      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
}

export function useCheckIntegrationHealth() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (accountId: string) => {
      if (!userOrg?.org.id) throw new Error('Organization not loaded');

      const res = await fetch('/api/auth/oauth/health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          orgId: userOrg.org.id,
          type: 'integration',
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Health check failed');
      }

      return json.health;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
}
