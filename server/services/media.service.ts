import type { SupabaseClient } from '@supabase/supabase-js';
import { MediaRepository, MediaFilters } from '../repositories/media.repo';
import type { MediaAsset } from '@/types/database';

export class MediaService {
  private repo: MediaRepository;

  constructor(supabase: SupabaseClient) {
    this.repo = new MediaRepository(supabase);
  }

  async getMediaAssets(orgId: string, filters: MediaFilters = {}): Promise<MediaAsset[]> {
    return this.repo.list(orgId, filters);
  }

  async getMediaById(id: string, orgId: string): Promise<MediaAsset | null> {
    return this.repo.getById(id, orgId);
  }

  async deleteMedia(id: string, orgId: string): Promise<void> {
    const existing = await this.repo.getById(id, orgId);
    if (!existing) {
      throw new Error('Media asset not found or access denied');
    }
    await this.repo.delete(id, orgId);
  }
}
