'use client';

import { useQuery } from '@tanstack/react-query';
import { organizationApi } from '@/lib/api-client/organization.api';
import type { Organization, OrganizationMember } from '@/types/database';

export interface UserOrg {
  org: Organization;
  role: OrganizationMember['role'];
}

export function useOrganization() {
  return useQuery<UserOrg | null>({
    queryKey: ['user-organization'],
    queryFn: async () => {
      try {
        const res = await organizationApi.getOrganization();
        return res;
      } catch (err) {
        console.warn('Organization lookup notice:', err);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
