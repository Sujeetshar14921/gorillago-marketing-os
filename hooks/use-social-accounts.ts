'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/hooks/use-organization';
import type { SocialAccount, SocialPlatform } from '@/types/database';

export function useSocialAccounts(options?: { includeDisconnected?: boolean }) {
  const { data: userOrg } = useOrganization();

  return useQuery<SocialAccount[]>({
    queryKey: ['social-accounts', userOrg?.org.id, options?.includeDisconnected],
    queryFn: async () => {
      if (!userOrg?.org.id) return [];

      const params = new URLSearchParams({ orgId: userOrg.org.id });
      if (options?.includeDisconnected) {
        params.set('includeDisconnected', 'true');
      }

      const res = await fetch(`/api/social-accounts?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to fetch social accounts');
      }
      return (json.data ?? []) as SocialAccount[];
    },
    enabled: !!userOrg?.org.id,
  });
}

export function useManualConnectSocialAccount() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (params: {
      platform: SocialPlatform;
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
          type: 'social',
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to connect account');
      }

      return json.data as SocialAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
    },
  });
}

export function useDisconnectSocialAccount() {
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
          type: 'social',
          deletePermanently: params.deletePermanently ?? false,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to disconnect account');
      }

      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
    },
  });
}

export function useCheckSocialAccountHealth() {
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
          type: 'social',
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Health check failed');
      }

      return json.health;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
    },
  });
}
