'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi, ContentFilters } from '@/lib/api-client/content.api';
import { useOrganization } from '@/hooks/use-organization';
import type { ContentGeneration, ContentType } from '@/types/database';

export type { ContentFilters };

export function useContentGenerations(filters: ContentFilters = {}) {
  const { data: userOrg } = useOrganization();

  return useQuery<ContentGeneration[]>({
    queryKey: ['content-generations', userOrg?.org.id, filters],
    queryFn: async () => {
      if (!userOrg?.org.id) return [];
      return contentApi.list(userOrg.org.id, filters);
    },
    enabled: !!userOrg?.org.id,
  });
}

export interface GenerateContentInput {
  type: ContentType;
  prompt: string;
  productId?: string;
  tone?: string;
  language?: string;
  model?: string;
}

export function useGenerateContent() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (input: GenerateContentInput) => {
      if (!userOrg?.org.id) throw new Error('No organization found');
      const res = await contentApi.generate({
        type: input.type,
        prompt: input.prompt,
        productId: input.productId,
        tone: input.tone,
        language: input.language,
        model: input.model,
        organizationId: userOrg.org.id,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-generations'] });
      queryClient.invalidateQueries({ queryKey: ['billing-credits'] });
      queryClient.invalidateQueries({ queryKey: ['credit-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['billing-overview'] });
    },
  });
}

export function useUpdateContent() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async ({
      id,
      content,
      isApproved,
    }: {
      id: string;
      content?: string;
      isApproved?: boolean;
    }) => {
      if (!userOrg?.org.id) throw new Error('No organization found');
      const updates: any = {};
      if (content !== undefined) updates.generated_content = content;
      if (isApproved !== undefined) updates.is_approved = isApproved;

      return contentApi.update(id, userOrg.org.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-generations'] });
    },
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!userOrg?.org.id) throw new Error('No organization found');
      await contentApi.delete(id, userOrg.org.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-generations'] });
    },
  });
}
