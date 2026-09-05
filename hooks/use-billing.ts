'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi, BillingOverviewResponse } from '@/lib/api-client/billing.api';
import { useOrganization } from '@/hooks/use-organization';
import type {
  BillingSubscription,
  BillingInvoice,
  BillingCredits,
  BillingCreditTransaction,
  BillingPlan,
} from '@/types/database';
import type { CreditPackId } from '@/lib/billing/gateway';

export function useBillingOverview() {
  const { data: userOrg } = useOrganization();

  return useQuery<BillingOverviewResponse>({
    queryKey: ['billing-overview', userOrg?.org.id],
    queryFn: async () => {
      if (!userOrg?.org.id) {
        return { subscription: null, credits: null, invoices: [], transactions: [] };
      }
      return billingApi.getOverview(userOrg.org.id);
    },
    enabled: !!userOrg?.org.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useSubscription() {
  const { data: overview, isLoading } = useBillingOverview();
  return {
    data: overview?.subscription ?? null,
    isLoading,
  };
}

export function useCredits() {
  const { data: overview, isLoading } = useBillingOverview();
  return {
    data: overview?.credits ?? null,
    isLoading,
  };
}

export function useInvoices() {
  const { data: overview, isLoading } = useBillingOverview();
  return {
    data: overview?.invoices ?? [],
    isLoading,
  };
}

export function useCreditTransactions() {
  const { data: overview, isLoading } = useBillingOverview();
  return {
    data: overview?.transactions ?? [],
    isLoading,
  };
}

export function useCreateCheckoutSession() {
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (params: {
      type: 'subscription' | 'credit_pack';
      plan?: BillingPlan;
      creditPackId?: CreditPackId;
      provider?: 'stripe' | 'razorpay' | 'sandbox' | 'auto';
    }) => {
      if (!userOrg?.org.id) throw new Error('Organization not loaded');
      return billingApi.checkout({
        orgId: userOrg.org.id,
        ...params,
      });
    },
  });
}

export function useConfirmSandboxPayment() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async (params: {
      type: 'subscription' | 'credit_pack';
      plan?: BillingPlan;
      creditPackId?: CreditPackId;
    }) => {
      if (!userOrg?.org.id) throw new Error('Organization not loaded');
      return billingApi.confirmSandbox({
        orgId: userOrg.org.id,
        ...params,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-overview'] });
    },
  });
}

export function useOpenCustomerPortal() {
  const { data: userOrg } = useOrganization();

  return useMutation<string, Error, string | void>({
    mutationFn: async () => {
      if (!userOrg?.org.id) throw new Error('Organization not loaded');
      const res = await billingApi.openPortal(userOrg.org.id);
      return res.url;
    },
  });
}

export function useInitializeBilling() {
  const queryClient = useQueryClient();
  const { data: userOrg } = useOrganization();

  return useMutation({
    mutationFn: async () => {
      if (!userOrg?.org.id) throw new Error('Organization not loaded');
      return billingApi.confirmSandbox({
        orgId: userOrg.org.id,
        type: 'subscription',
        plan: 'free',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-overview'] });
    },
  });
}
