'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaApi, MediaFilters } from '@/lib/api-client/media.api';
import { useOrganization } from '@/hooks/use-organization';
import type { MediaAsset, MediaCategory } from '@/types/database';

export type { MediaFilters };

export function useMediaAssets(filters: MediaFilters = {}) {
  const { data: userOrg } = useOrganization();

  return useQuery<MediaAsset[]>({
    queryKey: ['media-assets', userOrg?.org.id, filters],
    queryFn: async () => {
      if (!userOrg?.org.id) return [];
      return mediaApi.list(userOrg.org.id, filters);
    },
    enabled: !!userOrg?.org.id,
  });
}

export function useVideoAssets(filters: MediaFilters = {}) {
  const { data: userOrg } = useOrganization();

  return useQuery<MediaAsset[]>({
    queryKey: ['video-assets', userOrg?.org.id, filters],
    queryFn: async () => {
      if (!userOrg?.org.id) return [];
      return mediaApi.list(userOrg.org.id, { ...filters, type: 'video' });
    },
    enabled: !!userOrg?.org.id,
  });
}

export interface GenerateImageInput {
  prompt: string;
  category: MediaCategory;
  productId?: string;
  platform?: string;
  model?: string;
}

export function useGenerateImage() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (input: GenerateImageInput) => {
      if (!userOrg?.org.id) throw new Error('No organization found');
      const res = await mediaApi.generateImage({
        prompt: input.prompt,
        category: input.category,
        productId: input.productId,
        platform: input.platform,
        organizationId: userOrg.org.id,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      queryClient.invalidateQueries({ queryKey: ['billing-credits'] });
      queryClient.invalidateQueries({ queryKey: ['credit-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['billing-overview'] });
    },
  });
}

export function useDeleteMediaAsset() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!userOrg?.org.id) throw new Error('No organization found');
      await mediaApi.delete(id, userOrg.org.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      queryClient.invalidateQueries({ queryKey: ['video-assets'] });
    },
  });
}

export interface GenerateVideoInput {
  prompt: string;
  category: MediaCategory;
  productId?: string;
  platform?: string;
  durationSec?: number;
  style?: string;
  voiceover?: string;
  music?: string;
  captions?: boolean;
}

export function useGenerateVideo() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (input: GenerateVideoInput) => {
      if (!userOrg?.org.id) throw new Error('No organization found');
      const res = await mediaApi.generateVideo({
        prompt: input.prompt,
        category: input.category,
        productId: input.productId,
        platform: input.platform,
        durationSec: input.durationSec,
        style: input.style,
        voiceover: input.voiceover,
        music: input.music,
        captions: input.captions,
        organizationId: userOrg.org.id,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      queryClient.invalidateQueries({ queryKey: ['video-assets'] });
      queryClient.invalidateQueries({ queryKey: ['billing-credits'] });
      queryClient.invalidateQueries({ queryKey: ['billing-overview'] });
    },
  });
}

export interface UploadMediaInput {
  file: File;
  category?: MediaCategory;
  productId?: string;
  platform?: string;
}

export function useUploadMediaAsset() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (input: UploadMediaInput) => {
      if (!userOrg?.org.id) throw new Error('No organization found');

      const formData = new FormData();
      formData.append('file', input.file);
      formData.append('organizationId', userOrg.org.id);
      if (input.category) formData.append('category', input.category);
      if (input.productId && input.productId !== 'none') formData.append('productId', input.productId);
      if (input.platform && input.platform !== 'none') formData.append('platform', input.platform);

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload media asset');
      }

      return result.data as MediaAsset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      queryClient.invalidateQueries({ queryKey: ['video-assets'] });
    },
  });
}
