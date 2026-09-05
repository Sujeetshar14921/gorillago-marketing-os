import { apiGet, apiPost, apiPatch, apiDelete } from './client';
import type { AiConversation, AiMessage } from '@/types/database';

export const assistantApi = {
  getConversations: (orgId: string) =>
    apiGet<AiConversation[]>('/api/ai/conversations', { orgId }),

  createConversation: (orgId: string, title?: string) =>
    apiPost<AiConversation>('/api/ai/conversations', { orgId, title }),

  deleteConversation: (id: string, orgId: string) =>
    apiDelete<{ success: boolean }>(`/api/ai/conversations/${id}?orgId=${encodeURIComponent(orgId)}`),

  getMessages: (conversationId: string, orgId: string) =>
    apiGet<AiMessage[]>(`/api/ai/conversations/${conversationId}/messages`, { orgId }),

  updateMessageAction: (conversationId: string, orgId: string, messageId: string, actionStatus: 'approved' | 'rejected' | 'executed') =>
    apiPatch<AiMessage>(`/api/ai/conversations/${conversationId}/messages`, { orgId, messageId, actionStatus }),
};
