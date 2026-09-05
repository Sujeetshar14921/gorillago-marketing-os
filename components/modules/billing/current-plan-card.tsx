'use client';

import { motion } from 'framer-motion';
import { CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BillingSubscription } from '@/types/database';
import { PLANS, SUB_STATUS_META } from './billing-constants';

export interface CurrentPlanCardProps {
  subscription: BillingSubscription | null;
  onManagePortal: () => void;
  isPortalLoading: boolean;
}

export function CurrentPlanCard({
  subscription,
  onManagePortal,
  isPortalLoading,
}: CurrentPlanCardProps) {
  const plan = PLANS.find((p) => p.id === subscription?.plan) || PLANS[0];
  const status = subscription?.status || 'active';
  const statusMeta = SUB_STATUS_META[status] ?? SUB_STATUS_META.active;
  const periodEnd = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col justify-between rounded-xl border border-border bg-card p-5"
    >
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Current Plan</h3>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">{plan.name}</span>
              <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium', statusMeta.color)}>
                {statusMeta.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {plan.price === 0 ? 'Free tier' : `$${plan.price}/month`}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
            <CreditCard className="h-5 w-5 text-accent" />
          </div>
        </div>

        {periodEnd && plan.price > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Current billing cycle renews on <span className="font-medium text-foreground">{periodEnd.toLocaleDateString()}</span>
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border/50">
        <Button
          size="sm"
          variant="outline"
          onClick={onManagePortal}
          disabled={isPortalLoading}
          className="h-8 text-xs gap-1.5"
        >
          {isPortalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
          Manage Billing & Cards
        </Button>
      </div>
    </motion.div>
  );
}
