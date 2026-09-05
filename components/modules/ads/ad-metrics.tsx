'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Zap, DollarSign, TrendingUp } from 'lucide-react';
import { useAds } from '@/hooks/use-ads';
import type { CampaignAd } from '@/types/database';

export function AdMetrics() {
  const { data: ads } = useAds();

  const stats = useMemo(() => {
    const all = (ads ?? []) as CampaignAd[];
    const active = all.filter((a) => a.status === 'active');
    const totalDaily = active.reduce((sum, a) => sum + (a.daily_budget ?? 0), 0);
    const totalLifetime = all.reduce((sum, a) => sum + (a.lifetime_budget ?? 0), 0);

    return {
      total: all.length,
      active: active.length,
      dailyBudget: totalDaily,
      lifetimeBudget: totalLifetime,
    };
  }, [ads]);

  const cards = [
    { label: 'Total Ads', value: String(stats.total), icon: Megaphone, accent: 'text-accent bg-accent/10' },
    { label: 'Active Now', value: String(stats.active), icon: Zap, accent: 'text-emerald-600 bg-emerald-500/10' },
    { label: 'Daily Spend', value: `$${stats.dailyBudget.toLocaleString()}`, icon: DollarSign, accent: 'text-blue-600 bg-blue-500/10' },
    { label: 'Total Budget', value: `$${stats.lifetimeBudget.toLocaleString()}`, icon: TrendingUp, accent: 'text-purple-600 bg-purple-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="mt-0.5 text-xl font-bold text-foreground">{card.value}</p>
              </div>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.accent}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
