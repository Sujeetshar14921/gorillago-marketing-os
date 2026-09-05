import { apiGet, apiPost } from './client';
import type { BillingSubscription, BillingCredits, BillingInvoice, BillingCreditTransaction } from '@/types/database';

export interface BillingOverviewResponse {
  subscription: BillingSubscription | null;
  credits: BillingCredits | null;
  invoices: BillingInvoice[];
  transactions: BillingCreditTransaction[];
}

export const billingApi = {
  getOverview: (orgId: string) =>
    apiGet<BillingOverviewResponse>('/api/billing/overview', { orgId }),

  checkout: (data: {
    orgId: string;
    type?: 'subscription' | 'credit_pack';
    plan?: string;
    creditPackId?: string;
    provider?: 'auto' | 'stripe' | 'razorpay' | 'sandbox';
  }) => apiPost<any>('/api/billing/checkout', data),

  confirmSandbox: (data: {
    orgId: string;
    type?: 'subscription' | 'credit_pack';
    plan?: string;
    creditPackId?: string;
  }) => apiPost<any>('/api/billing/confirm-sandbox', data),

  openPortal: (orgId: string) =>
    apiPost<{ url: string }>('/api/billing/portal', { orgId }),
};
