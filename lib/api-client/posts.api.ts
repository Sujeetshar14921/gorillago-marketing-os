import { apiGet, apiPost, apiPatch, apiDelete } from './client';
import type { CampaignPost, PostStatus, SocialPlatform } from '@/types/database';

export interface PostFilters {
  status?: PostStatus | 'all';
  platform?: SocialPlatform | 'all';
  campaignId?: string;
  search?: string;
}

export interface CreatePostPayload {
  orgId: string;
  campaignId: string;
  platform: SocialPlatform;
  content: string;
  hashtags: string[];
  mediaUrls: string[];
  socialAccountId?: string;
  scheduledAt?: string;
  status?: PostStatus;
}

export const postsApi = {
  getPosts: (orgId: string, filters?: PostFilters) => {
    const params: Record<string, string> = { orgId };
    if (filters?.status && filters.status !== 'all') params.status = filters.status;
    if (filters?.platform && filters.platform !== 'all') params.platform = filters.platform;
    if (filters?.campaignId) params.campaignId = filters.campaignId;
    if (filters?.search) params.search = filters.search;
    return apiGet<CampaignPost[]>('/api/posts', params);
  },

  createPost: (payload: CreatePostPayload) =>
    apiPost<CampaignPost>('/api/posts', payload),

  updatePost: (id: string, orgId: string, updates: Partial<CreatePostPayload>) =>
    apiPatch<CampaignPost>(`/api/posts/${id}`, { orgId, ...updates }),

  deletePost: (id: string, orgId: string) =>
    apiDelete<{ success: boolean }>(`/api/posts/${id}?orgId=${encodeURIComponent(orgId)}`),
};
