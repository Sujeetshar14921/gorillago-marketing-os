import type { SupabaseClient } from '@supabase/supabase-js';
import type { Organization, OrganizationSettings, OrganizationMember, Brand } from '@/types/database';

export class OrganizationRepository {
  constructor(private supabase: SupabaseClient) {}

  async getById(orgId: string): Promise<Organization | null> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .maybeSingle();

    if (error) throw error;
    return data as Organization | null;
  }

  async getSettings(orgId: string): Promise<OrganizationSettings | null> {
    const { data, error } = await this.supabase
      .from('organization_settings')
      .select('*')
      .eq('organization_id', orgId)
      .maybeSingle();

    if (error) throw error;
    return data as OrganizationSettings | null;
  }

  async updateSettings(orgId: string, updates: Partial<OrganizationSettings>): Promise<OrganizationSettings> {
    // Check if settings row exists
    const existing = await this.getSettings(orgId);
    if (!existing) {
      const { data, error } = await this.supabase
        .from('organization_settings')
        .insert({ organization_id: orgId, ...updates })
        .select()
        .single();
      if (error) throw error;
      return data as OrganizationSettings;
    }

    const { data, error } = await this.supabase
      .from('organization_settings')
      .update(updates)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return data as OrganizationSettings;
  }

  async getMembers(orgId: string): Promise<OrganizationMember[]> {
    const { data, error } = await this.supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', orgId)
      .eq('status', 'active');

    if (error) throw error;
    return (data ?? []) as OrganizationMember[];
  }

  async getBrands(orgId: string): Promise<Brand[]> {
    const { data, error } = await this.supabase
      .from('brands')
      .select('*')
      .eq('organization_id', orgId);

    if (error) throw error;
    return (data ?? []) as Brand[];
  }

  async getBrand(orgId: string): Promise<Brand | null> {
    const { data, error } = await this.supabase
      .from('brands')
      .select('*')
      .eq('organization_id', orgId)
      .maybeSingle();

    if (error) {
      console.warn('Failed to load brand:', error.message);
      return null;
    }
    return data as Brand | null;
  }

  async upsertBrand(orgId: string, input: Partial<Brand>): Promise<Brand> {
    const existing = await this.getBrand(orgId);
    if (existing) {
      const { data, error } = await this.supabase
        .from('brands')
        .update(input)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data as Brand;
    } else {
      const { data, error } = await this.supabase
        .from('brands')
        .insert({
          ...input,
          organization_id: orgId,
          name: input.name || 'Default Brand',
        })
        .select()
        .single();

      if (error) throw error;
      return data as Brand;
    }
  }
}
