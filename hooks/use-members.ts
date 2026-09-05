'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/hooks/use-organization';
import { organizationApi, MemberWithProfile } from '@/lib/api-client/organization.api';
import type { OrganizationMember, UserRole } from '@/types/database';

export type { MemberWithProfile };

export function useMembers() {
  const { data: userOrg } = useOrganization();

  return useQuery<MemberWithProfile[]>({
    queryKey: ['members', userOrg?.org.id],
    queryFn: async () => {
      if (!userOrg?.org.id) return [];
      return organizationApi.getMembers(userOrg.org.id);
    },
    enabled: !!userOrg?.org.id,
  });
}

export interface InviteMemberInput {
  email: string;
  role: UserRole;
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (input: InviteMemberInput) => {
      if (!userOrg?.org.id) throw new Error('No organization found');
      return organizationApi.inviteMember(userOrg.org.id, input.email, input.role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async ({
      memberId,
      role,
    }: {
      memberId: string;
      role: UserRole;
    }) => {
      if (!userOrg?.org.id) throw new Error('No organization found');
      return organizationApi.updateMemberRole(userOrg.org.id, memberId, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (memberId: string) => {
      if (!userOrg?.org.id) throw new Error('No organization found');
      return organizationApi.removeMember(userOrg.org.id, memberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}
