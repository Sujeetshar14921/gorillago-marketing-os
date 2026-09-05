'use client';

import { CreditCard, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { BillingPlan } from '@/types/database';
import type { CreditPackId } from '@/lib/billing/gateway';

export interface CheckoutModalState {
  open: boolean;
  type: 'subscription' | 'credit_pack';
  plan?: BillingPlan;
  creditPackId?: CreditPackId;
  title: string;
  amount: number;
  description: string;
}

export interface CheckoutDialogProps {
  modal: CheckoutModalState | null;
  onClose: () => void;
  onSandboxPay: () => Promise<void>;
  onStripePay: () => Promise<void>;
  isSandboxLoading: boolean;
  isStripeLoading: boolean;
}

export function CheckoutDialog({
  modal,
  onClose,
  onSandboxPay,
  onStripePay,
  isSandboxLoading,
  isStripeLoading,
}: CheckoutDialogProps) {
  if (!modal) return null;

  return (
    <Dialog open={modal.open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
              <CreditCard className="h-4 w-4 text-accent" />
            </div>
            <DialogTitle>{modal.title}</DialogTitle>
          </div>
          <DialogDescription>{modal.description}</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Amount Due</span>
            <span className="font-bold text-foreground text-lg">${modal.amount}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Billing Cycle</span>
            <span>{modal.type === 'subscription' ? 'Monthly auto-renew' : 'One-time charge'}</span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Button
            onClick={onSandboxPay}
            disabled={isSandboxLoading}
            className="w-full bg-accent text-white hover:bg-accent/90 text-xs gap-1.5 h-10"
          >
            {isSandboxLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Sandbox Instant Pay (1-Click Test)
          </Button>

          <Button
            onClick={onStripePay}
            disabled={isStripeLoading}
            variant="outline"
            className="w-full text-xs gap-1.5 h-10"
          >
            {isStripeLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            Pay with Credit Card (Stripe Hosted)
          </Button>
        </div>

        <DialogFooter className="mt-2">
          <p className="text-[11px] text-center w-full text-muted-foreground">
            Bank-grade 256-bit SSL encryption. You can cancel anytime.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
