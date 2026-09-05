'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, TrendingUp, Receipt, Zap } from 'lucide-react';
import {
  useSubscription,
  useInvoices,
  useCredits,
  useCreditTransactions,
  useCreateCheckoutSession,
  useConfirmSandboxPayment,
  useOpenCustomerPortal,
  useInitializeBilling,
} from '@/hooks/use-billing';
import { useOrganization } from '@/hooks/use-organization';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CREDIT_PACKS, CreditPackId } from '@/lib/billing/gateway';
import type { BillingPlan } from '@/types/database';

import { PLANS } from '@/components/modules/billing/billing-constants';
import { CurrentPlanCard } from '@/components/modules/billing/current-plan-card';
import { CreditsOverviewCard } from '@/components/modules/billing/credits-overview-card';
import { PlanTierCard } from '@/components/modules/billing/plan-tier-card';
import { CreditBoosterPacks } from '@/components/modules/billing/credit-booster-packs';
import { InvoicesTable } from '@/components/modules/billing/invoices-table';
import { CreditHistoryTable } from '@/components/modules/billing/credit-history-table';
import { CheckoutDialog, CheckoutModalState } from '@/components/modules/billing/checkout-dialog';

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}

function BillingContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const { data: userOrg } = useOrganization();

  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: invoices } = useInvoices();
  const { data: credits, isLoading: credLoading } = useCredits();
  const { data: transactions } = useCreditTransactions();

  const createCheckout = useCreateCheckoutSession();
  const confirmSandbox = useConfirmSandboxPayment();
  const openPortal = useOpenCustomerPortal();
  const initBilling = useInitializeBilling();

  const [checkoutModal, setCheckoutModal] = useState<CheckoutModalState | null>(null);

  // Auto-initialize free tier if no subscription exists
  useEffect(() => {
    if (!subLoading && !subscription && userOrg?.org.id && !initBilling.isPending) {
      initBilling.mutate();
    }
  }, [subscription, subLoading, userOrg, initBilling]);

  // Payment status from URL search params
  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'success') {
      toast({
        title: 'Payment Confirmed!',
        description: 'Your plan and AI quotas have been replenished.',
      });
    } else if (payment === 'cancelled') {
      toast({
        title: 'Checkout Cancelled',
        description: 'No charges were incurred.',
        variant: 'destructive',
      });
    }
  }, [searchParams, toast]);

  const handleOpenPlanCheckout = (planId: BillingPlan) => {
    const plan = PLANS.find((p) => p.id === planId);
    if (!plan) return;

    setCheckoutModal({
      open: true,
      type: 'subscription',
      plan: planId,
      title: `${plan.name} Plan Upgrade`,
      amount: plan.price,
      description: `Includes ${plan.credits.content} Content, ${plan.credits.image} Image, and ${plan.credits.video} Video credits per month.`,
    });
  };

  const handleOpenPackCheckout = (packId: CreditPackId) => {
    const pack = CREDIT_PACKS[packId];
    if (!pack) return;

    setCheckoutModal({
      open: true,
      type: 'credit_pack',
      creditPackId: packId,
      title: pack.name,
      amount: pack.priceUsd,
      description: `Adds +${pack.amount} ${pack.creditType} credits directly to your organization balance.`,
    });
  };

  const handleExecuteSandboxPayment = async () => {
    if (!checkoutModal) return;
    try {
      await confirmSandbox.mutateAsync({
        type: checkoutModal.type,
        plan: checkoutModal.plan,
        creditPackId: checkoutModal.creditPackId,
      });

      toast({
        title: 'Sandbox Payment Completed',
        description:
          checkoutModal.type === 'subscription'
            ? `Upgraded to ${checkoutModal.title} successfully!`
            : `Added credits for ${checkoutModal.title}!`,
      });
      setCheckoutModal(null);
    } catch (err: any) {
      toast({
        title: 'Payment Simulation Failed',
        description: err?.message || 'Could not process sandbox payment',
        variant: 'destructive',
      });
    }
  };

  const handleExecuteStripeCheckout = async () => {
    if (!checkoutModal) return;
    try {
      const result = await createCheckout.mutateAsync({
        type: checkoutModal.type,
        plan: checkoutModal.plan,
        creditPackId: checkoutModal.creditPackId,
        provider: 'stripe',
      });

      if (result.url) {
        window.location.href = result.url;
      } else {
        toast({
          title: 'Notice',
          description: 'Redirecting via sandbox checkout mode.',
        });
        await handleExecuteSandboxPayment();
      }
    } catch (err: any) {
      toast({
        title: 'Checkout Failed',
        description: err?.message || 'Stripe initialization failed',
        variant: 'destructive',
      });
    }
  };

  const handleOpenBillingPortal = async () => {
    try {
      const portalUrl = await openPortal.mutateAsync();
      window.location.href = portalUrl;
    } catch (err: any) {
      toast({
        title: 'Portal Notice',
        description: err?.message || 'Customer portal is only available for active Stripe subscribers.',
        variant: 'destructive',
      });
    }
  };

  if (subLoading || credLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Billing & Monetization</h1>
        <p className="text-sm text-muted-foreground">
          Manage your subscription plan, purchase extra AI credit packs, view invoices, and track generation history.
        </p>
      </motion.div>

      {/* Current Plan + Credits Overview */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CurrentPlanCard
          subscription={subscription ?? null}
          onManagePortal={handleOpenBillingPortal}
          isPortalLoading={openPortal.isPending}
        />
        <CreditsOverviewCard credits={credits ?? null} onBuyCredits={() => handleOpenPackCheckout('content_500')} />
      </div>

      {/* Credit Add-On Packs */}
      <CreditBoosterPacks onBuyPack={handleOpenPackCheckout} />

      {/* Tabs */}
      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans" className="gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Subscription Plans
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1.5">
            <Receipt className="h-3.5 w-3.5" />
            Invoices & Receipts
          </TabsTrigger>
          <TabsTrigger value="credits" className="gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            Credit History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {PLANS.map((plan, idx) => (
              <PlanTierCard
                key={plan.id}
                plan={plan}
                currentPlan={subscription?.plan}
                index={idx}
                onSelect={() => handleOpenPlanCheckout(plan.id)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <InvoicesTable invoices={invoices} />
        </TabsContent>

        <TabsContent value="credits" className="mt-4">
          <CreditHistoryTable transactions={transactions} />
        </TabsContent>
      </Tabs>

      {/* Unified Checkout Modal */}
      <CheckoutDialog
        modal={checkoutModal}
        onClose={() => setCheckoutModal(null)}
        onSandboxPay={handleExecuteSandboxPayment}
        onStripePay={handleExecuteStripeCheckout}
        isSandboxLoading={confirmSandbox.isPending}
        isStripeLoading={createCheckout.isPending}
      />
    </div>
  );
}
