'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/hooks/use-organization';
import { organizationApi } from '@/lib/api-client/organization.api';
import type { Brand } from '@/types/database';

export function useBrand() {
  const { data: userOrg } = useOrganization();

  return useQuery<Brand | null>({
    queryKey: ['brand', userOrg?.org.id],
    queryFn: async () => {
      if (!userOrg?.org.id) return null;
      return organizationApi.getBrand(userOrg.org.id);
    },
    enabled: !!userOrg?.org.id,
  });
}

export interface UpsertBrandInput {
  name: string;
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  font_family?: string | null;
  tone_of_voice?: string | null;
  language?: string;
  description?: string | null;
}

export function useUpsertBrand() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (input: UpsertBrandInput) => {
      const orgId = userOrg?.org.id;
      if (!orgId) {
        throw new Error('Organization workspace is not loaded');
      }

      return organizationApi.upsertBrand(orgId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand'] });
      queryClient.invalidateQueries({ queryKey: ['user-organization'] });
    },
  });
}
