import { apiGet, apiPut, apiPost, apiPatch, apiDelete } from './client';
import type { Organization, OrganizationSettings, OrganizationMember, Brand, UserRole } from '@/types/database';

export interface MemberWithProfile extends OrganizationMember {
  email?: string;
  full_name?: string;
}

export const organizationApi = {
  getOrganization: (orgId?: string) =>
    apiGet<{ org: Organization; role: OrganizationMember['role'] }>('/api/organization', orgId ? { orgId } : undefined),

  getSettings: (orgId?: string) =>
    apiGet<OrganizationSettings>('/api/organization/settings', orgId ? { orgId } : undefined),

  updateSettings: (orgId: string, updates: Partial<OrganizationSettings>) =>
    apiPut<OrganizationSettings>('/api/organization/settings', { orgId, ...updates }),

  getBrand: (orgId?: string) =>
    apiGet<Brand | null>('/api/organization/brand', orgId ? { orgId } : undefined),

  upsertBrand: (orgId: string, brand: Partial<Brand>) =>
    apiPut<Brand>('/api/organization/brand', { orgId, ...brand }),

  getMembers: (orgId?: string) =>
    apiGet<MemberWithProfile[]>('/api/organization/members', orgId ? { orgId } : undefined),

  inviteMember: (orgId: string, email: string, role: UserRole) =>
    apiPost<OrganizationMember>('/api/organization/members', { orgId, email, role }),

  updateMemberRole: (orgId: string, memberId: string, role: UserRole) =>
    apiPatch<OrganizationMember>('/api/organization/members', { orgId, memberId, role }),

  removeMember: (orgId: string, memberId: string) =>
    apiDelete<{ success: boolean }>(`/api/organization/members?orgId=${encodeURIComponent(orgId)}&memberId=${encodeURIComponent(memberId)}`),
};
