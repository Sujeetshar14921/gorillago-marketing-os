'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CREDIT_PACKS, CreditPackId } from '@/lib/billing/gateway';
import { CREDIT_ICONS } from './billing-constants';

export interface CreditBoosterPacksProps {
  onBuyPack: (packId: CreditPackId) => void;
}

export function CreditBoosterPacks({ onBuyPack }: CreditBoosterPacksProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
            AI Credit Booster Packs
          </h3>
          <p className="text-xs text-muted-foreground">
            Need extra volume without changing tiers? Top-up credits never expire.
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] text-accent border-accent/30 font-medium">
          No Tier Change Needed
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {Object.values(CREDIT_PACKS).map((pack) => {
          const PIcon = CREDIT_ICONS[pack.creditType];
          return (
            <div
              key={pack.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-sidebar-hover"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                    <PIcon className="h-4 w-4 text-accent" />
                  </div>
                  <span className="text-base font-bold text-foreground">${pack.priceUsd}</span>
                </div>
                <h4 className="text-sm font-semibold text-foreground">{pack.name}</h4>
                <p className="text-xs text-muted-foreground">
                  Instant delivery of {pack.amount} high-quality {pack.creditType} generations.
                </p>
              </div>

              <Button
                onClick={() => onBuyPack(pack.id)}
                size="sm"
                className="mt-4 w-full bg-accent text-white hover:bg-accent/90 text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Buy Pack
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
