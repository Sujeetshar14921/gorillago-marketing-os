import type { SupabaseClient } from '@supabase/supabase-js';
import { ContentRepository, ContentFilters } from '../repositories/content.repo';
import type { ContentGeneration } from '@/types/database';

export class ContentService {
  private repo: ContentRepository;

  constructor(supabase: SupabaseClient) {
    this.repo = new ContentRepository(supabase);
  }

  async getContentList(orgId: string, filters: ContentFilters = {}): Promise<ContentGeneration[]> {
    return this.repo.list(orgId, filters);
  }

  async getContentById(id: string, orgId: string): Promise<ContentGeneration | null> {
    return this.repo.getById(id, orgId);
  }

  async updateContent(id: string, orgId: string, updates: Partial<ContentGeneration>): Promise<ContentGeneration> {
    const existing = await this.repo.getById(id, orgId);
    if (!existing) {
      throw new Error('Content record not found or access denied');
    }
    return this.repo.update(id, orgId, updates);
  }

  async deleteContent(id: string, orgId: string): Promise<void> {
    const existing = await this.repo.getById(id, orgId);
    if (!existing) {
      throw new Error('Content record not found or access denied');
    }
    await this.repo.delete(id, orgId);
  }
}
