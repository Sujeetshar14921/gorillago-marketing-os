import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { ContentGeneration, ContentType } from '@/types/database';

export interface ContentFilters {
  type?: ContentType | 'all';
  search?: string;
}

export const contentApi = {
  list: (orgId: string, filters: ContentFilters = {}) =>
    apiGet<ContentGeneration[]>('/api/content', { orgId, ...filters }),

  getById: (id: string, orgId: string) =>
    apiGet<ContentGeneration>(`/api/content/${id}`, { orgId }),

  generate: (data: {
    type: ContentType;
    prompt: string;
    tone?: string;
    language?: string;
    model?: string;
    productId?: string;
    organizationId: string;
  }) => apiPost<{ data: ContentGeneration; credits: any }>('/api/ai/content', data),

  update: (id: string, orgId: string, updates: Partial<ContentGeneration>) =>
    apiPut<ContentGeneration>(`/api/content/${id}`, { orgId, ...updates }),

  delete: (id: string, orgId: string) =>
    apiDelete<{ deleted: boolean }>(`/api/content/${id}`, { orgId }),
};
