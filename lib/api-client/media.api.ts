import { apiGet, apiPost, apiDelete } from './client';
import type { MediaAsset, MediaCategory } from '@/types/database';

export interface MediaFilters {
  category?: MediaCategory | 'all';
  search?: string;
  type?: 'image' | 'video';
}

export const mediaApi = {
  list: (orgId: string, filters: MediaFilters = {}) =>
    apiGet<MediaAsset[]>('/api/media', { orgId, ...filters }),

  getById: (id: string, orgId: string) =>
    apiGet<MediaAsset>(`/api/media/${id}`, { orgId }),

  generateImage: (data: {
    prompt: string;
    category: MediaCategory;
    productId?: string;
    platform?: string;
    organizationId: string;
  }) => apiPost<{ data: MediaAsset; credits: any }>('/api/ai/image', data),

  generateVideo: (data: {
    prompt: string;
    category?: string;
    productId?: string;
    platform?: string;
    organizationId: string;
    durationSec?: number;
    style?: string;
    voiceover?: string;
    music?: string;
    captions?: boolean;
  }) => apiPost<{ data: MediaAsset; credits: any }>('/api/ai/video', data),

  delete: (id: string, orgId: string) =>
    apiDelete<{ deleted: boolean }>(`/api/media/${id}`, { orgId }),
};
