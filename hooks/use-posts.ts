'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/hooks/use-organization';
import { postsApi, PostFilters, CreatePostPayload } from '@/lib/api-client/posts.api';
import type { CampaignPost, PostStatus, SocialPlatform } from '@/types/database';

export type { PostFilters };

export function useCampaignPosts(filters: PostFilters = {}) {
  const { data: userOrg } = useOrganization();

  return useQuery<CampaignPost[]>({
    queryKey: ['campaign-posts', userOrg?.org.id, filters],
    queryFn: async () => {
      if (!userOrg?.org.id) return [];
      return postsApi.getPosts(userOrg.org.id, filters);
    },
    enabled: !!userOrg?.org.id,
  });
}

export interface CreatePostInput {
  campaignId: string;
  platform: SocialPlatform;
  content: string;
  hashtags: string[];
  mediaUrls: string[];
  socialAccountId?: string;
  scheduledAt?: string;
  status?: PostStatus;
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreatePostInput) => {
      if (!userOrg?.org.id) throw new Error('No organization found');

      return postsApi.createPost({
        orgId: userOrg.org.id,
        campaignId: input.campaignId,
        platform: input.platform,
        content: input.content,
        hashtags: input.hashtags,
        mediaUrls: input.mediaUrls,
        socialAccountId: input.socialAccountId,
        scheduledAt: input.scheduledAt,
        status: input.status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-posts'] });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async ({
      id,
      content,
      hashtags,
      mediaUrls,
      status,
      scheduledAt,
    }: {
      id: string;
      content?: string;
      hashtags?: string[];
      mediaUrls?: string[];
      status?: PostStatus;
      scheduledAt?: string | null;
    }) => {
      if (!userOrg?.org.id) throw new Error('No organization found');

      return postsApi.updatePost(id, userOrg.org.id, {
        content,
        hashtags,
        mediaUrls,
        status,
        scheduledAt: scheduledAt ?? undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-posts'] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!userOrg?.org.id) throw new Error('No organization found');
      return postsApi.deletePost(id, userOrg.org.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-posts'] });
    },
  });
}

export function usePublishPostNow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch('/api/posts/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to publish post');
      }

      return result.post as CampaignPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-posts'] });
    },
  });
}

export function useTriggerScheduledWorker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/cron/publish-scheduled-posts', {
        method: 'POST',
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to run scheduled worker');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-posts'] });
    },
  });
}
