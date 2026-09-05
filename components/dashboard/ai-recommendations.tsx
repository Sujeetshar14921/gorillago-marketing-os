'use client';

import { motion } from 'framer-motion';
import { Bot, ArrowRight, Lightbulb, AlertTriangle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Recommendation {
  id: string;
  type: 'optimize' | 'insight' | 'warning';
  title: string;
  description: string;
  action?: string;
}

const recommendations: Recommendation[] = [
  {
    id: '1',
    type: 'insight',
    title: 'Best posting time detected',
    description: 'Your Instagram audience is most active at 7 PM on Wednesdays. Schedule posts accordingly.',
    action: 'Auto-schedule',
  },
  {
    id: '2',
    type: 'optimize',
    title: 'Reallocate budget for higher ROAS',
    description: 'Move $200 from Display Placements to Lookalike Audiences — projected +18% ROAS.',
    action: 'Apply',
  },
  {
    id: '3',
    type: 'warning',
    title: 'Ad fatigue on Summer Sale creative',
    description: 'Your top ad has been shown to 60% of your audience 4+ times. Refresh creative to avoid CTR drop.',
    action: 'Generate new',
  },
];

const typeConfig = {
  insight: { icon: Lightbulb, accent: 'text-chart-3 bg-chart-3/10', label: 'Insight' },
  optimize: { icon: TrendingUp, accent: 'text-accent bg-accent/10', label: 'Optimization' },
  warning: { icon: AlertTriangle, accent: 'text-warning bg-warning/10', label: 'Warning' },
};

export function AIRecommendations() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-chart-2">
          <Bot className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">AI Recommendations</h3>
          <p className="text-[11px] text-muted-foreground">Powered by continuous learning</p>
        </div>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, idx) => {
          const config = typeConfig[rec.type];
          const Icon = config.icon;

          return (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.25 + idx * 0.08 }}
              className="group rounded-lg border border-border/60 bg-background/40 p-3.5 transition-all hover:border-border hover:bg-muted/30"
            >
              <div className="flex items-start gap-3">
                <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md', config.accent)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-foreground">{rec.title}</p>
                    <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                      {config.label}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">{rec.description}</p>
                  {rec.action && (
                    <button className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-accent transition-colors hover:text-accent/80">
                      {rec.action}
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
