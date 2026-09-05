'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/hooks/use-organization';
import { organizationApi } from '@/lib/api-client/organization.api';
import type { OrganizationSettings } from '@/types/database';

export function useOrgSettings() {
  const { data: userOrg } = useOrganization();

  return useQuery<OrganizationSettings | null>({
    queryKey: ['org-settings', userOrg?.org.id],
    queryFn: async () => {
      if (!userOrg?.org.id) return null;
      return organizationApi.getSettings(userOrg.org.id);
    },
    enabled: !!userOrg?.org.id,
  });
}

export interface UpdateSettingsInput {
  timezone?: string;
  default_language?: string;
  ai_tone?: string | null;
  ai_model?: string;
  auto_pilot_enabled?: boolean;
  auto_pilot_auto_publish?: boolean;
  auto_pilot_auto_ads?: boolean;
  notification_email?: boolean;
  notification_push?: boolean;
}

export function useUpdateOrgSettings() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (input: UpdateSettingsInput) => {
      const orgId = userOrg?.org.id;
      if (!orgId) {
        throw new Error('Organization not found. Please refresh the page and try again.');
      }

      return organizationApi.updateSettings(orgId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-settings'] });
      queryClient.invalidateQueries({ queryKey: ['user-organization'] });
    },
  });
}
