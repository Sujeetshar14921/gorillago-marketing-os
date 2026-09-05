import type { SupabaseClient } from '@supabase/supabase-js';
import { OrganizationRepository } from '../repositories/organization.repo';
import type { Organization, OrganizationSettings, OrganizationMember, Brand } from '@/types/database';

export class OrganizationService {
  private repo: OrganizationRepository;

  constructor(supabase: SupabaseClient) {
    this.repo = new OrganizationRepository(supabase);
  }

  async getOrganization(orgId: string): Promise<Organization | null> {
    return this.repo.getById(orgId);
  }

  async getSettings(orgId: string): Promise<OrganizationSettings | null> {
    return this.repo.getSettings(orgId);
  }

  async updateSettings(orgId: string, updates: Partial<OrganizationSettings>): Promise<OrganizationSettings> {
    return this.repo.updateSettings(orgId, updates);
  }

  async getMembers(orgId: string): Promise<OrganizationMember[]> {
    return this.repo.getMembers(orgId);
  }

  async getBrands(orgId: string): Promise<Brand[]> {
    return this.repo.getBrands(orgId);
  }

  async getBrand(orgId: string): Promise<Brand | null> {
    return this.repo.getBrand(orgId);
  }

  async upsertBrand(orgId: string, input: Partial<Brand>): Promise<Brand> {
    return this.repo.upsertBrand(orgId, input);
  }
}
