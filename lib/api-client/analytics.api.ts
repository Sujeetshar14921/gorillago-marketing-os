import { apiGet } from './client';
import type { AnalyticsSnapshot } from '@/types/database';

export interface AnalyticsDateRange {
  from: string;
  to: string;
}

export const analyticsApi = {
  getSnapshots: (orgId: string, range: AnalyticsDateRange, entityType: 'organization' | 'social_account' = 'organization') =>
    apiGet<AnalyticsSnapshot[]>('/api/analytics', {
      orgId,
      entityType,
      from: range.from,
      to: range.to,
    }),

  getLatestAiInsight: (orgId: string) =>
    apiGet<{ aiSuggestion: string | null }>('/api/analytics', {
      orgId,
      latestInsight: 'true',
    }),
};
