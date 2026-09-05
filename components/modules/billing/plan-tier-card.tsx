'use client';

import { motion } from 'framer-motion';
import { Check, PenSquare, Image as ImageIcon, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BillingPlan } from '@/types/database';
import { PLANS } from './billing-constants';

export interface PlanTierCardProps {
  plan: (typeof PLANS)[0];
  currentPlan?: BillingPlan;
  index: number;
  onSelect: () => void;
}

export function PlanTierCard({ plan, currentPlan, index, onSelect }: PlanTierCardProps) {
  const isCurrent = (currentPlan ?? 'free') === plan.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        'relative flex flex-col justify-between rounded-xl border bg-card p-5 transition-shadow hover:shadow-md',
        plan.highlighted ? 'border-accent shadow-sm ring-1 ring-accent/30' : 'border-border',
        isCurrent && 'ring-2 ring-primary'
      )}
    >
      {plan.highlighted && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold text-white">
          Most Popular
        </span>
      )}

      <div>
        <h4 className="text-base font-bold text-foreground">{plan.name}</h4>
        <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>

        <div className="mt-3">
          <span className="text-3xl font-extrabold text-foreground">${plan.price}</span>
          <span className="text-xs text-muted-foreground">{plan.price === 0 ? '' : '/mo'}</span>
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Monthly Quotas</p>
          <div className="mt-2 space-y-1.5 text-xs text-foreground">
            <div className="flex items-center gap-1.5">
              <PenSquare className="h-3.5 w-3.5 text-accent" />
              <span>{plan.credits.content} AI Content</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-accent" />
              <span>{plan.credits.image} AI Images</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5 text-accent" />
              <span>{plan.credits.video} AI Videos</span>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Features</p>
          <ul className="mt-2 space-y-1.5">
            {plan.features.map((feat) => (
              <li key={feat} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border/50">
        <Button
          onClick={onSelect}
          disabled={isCurrent}
          variant={isCurrent ? 'outline' : plan.highlighted ? 'default' : 'outline'}
          className={cn(
            'w-full text-xs h-9',
            isCurrent
              ? 'border-muted-foreground/30 text-muted-foreground'
              : plan.highlighted
              ? 'bg-accent text-white hover:bg-accent/90'
              : ''
          )}
        >
          {isCurrent ? 'Current Plan' : plan.price === 0 ? 'Downgrade' : 'Upgrade'}
        </Button>
      </div>
    </motion.div>
  );
}
