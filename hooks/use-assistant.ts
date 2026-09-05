'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/hooks/use-organization';
import { assistantApi } from '@/lib/api-client/assistant.api';
import type { AiConversation, AiMessage, AiAction } from '@/types/database';

export function useConversations() {
  const { data: userOrg } = useOrganization();

  return useQuery<AiConversation[]>({
    queryKey: ['ai-conversations', userOrg?.org.id],
    queryFn: async () => {
      if (!userOrg?.org.id) return [];
      return assistantApi.getConversations(userOrg.org.id);
    },
    enabled: !!userOrg?.org.id,
  });
}

export function useMessages(conversationId: string | null) {
  const { data: userOrg } = useOrganization();

  return useQuery<AiMessage[]>({
    queryKey: ['ai-messages', conversationId],
    queryFn: async () => {
      if (!conversationId || !userOrg?.org.id) return [];
      return assistantApi.getMessages(conversationId, userOrg.org.id);
    },
    enabled: !!userOrg?.org.id && !!conversationId,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (title: string | undefined) => {
      if (!userOrg?.org.id) throw new Error('No organization found');
      return assistantApi.createConversation(userOrg.org.id, title);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!userOrg?.org.id) throw new Error('No organization found');
      return assistantApi.deleteConversation(id, userOrg.org.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['ai-messages'] });
    },
  });
}

export interface SendMessageInput {
  conversationId: string;
  content: string;
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async ({ conversationId, content }: SendMessageInput) => {
      if (!userOrg?.org.id) throw new Error('No organization found');

      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          content,
          organizationId: userOrg.org.id,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      return result.data as AiMessage;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
    },
  });
}

export function useUpdateMessageAction() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async ({
      conversationId,
      messageId,
      actionStatus,
    }: {
      conversationId: string;
      messageId: string;
      actionStatus: 'approved' | 'rejected' | 'executed';
    }) => {
      if (!userOrg?.org.id) throw new Error('No organization found');
      return assistantApi.updateMessageAction(conversationId, userOrg.org.id, messageId, actionStatus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-messages'] });
    },
  });
}
