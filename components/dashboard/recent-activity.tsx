'use client';

import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  Bot,
  Megaphone,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'error' | 'pending' | 'info';
}

const activities: ActivityItem[] = [
  {
    id: '1',
    icon: CheckCircle2,
    title: 'Campaign published',
    description: 'Summer Sale — 6 posts live on Instagram & Facebook',
    timestamp: '2 min ago',
    status: 'success',
  },
  {
    id: '2',
    icon: Bot,
    title: 'AI generation completed',
    description: '12 captions generated for Product Launch campaign',
    timestamp: '15 min ago',
    status: 'info',
  },
  {
    id: '3',
    icon: Upload,
    title: 'Products imported',
    description: '24 products synced from Shopify store',
    timestamp: '1 hour ago',
    status: 'success',
  },
  {
    id: '4',
    icon: Megaphone,
    title: 'Ad campaign launched',
    description: 'Meta Ads — Lookalike Audience (1% ) — $500/day',
    timestamp: '3 hours ago',
    status: 'success',
  },
  {
    id: '5',
    icon: XCircle,
    title: 'Post failed',
    description: 'LinkedIn post failed — token expired, reconnect account',
    timestamp: '5 hours ago',
    status: 'error',
  },
  {
    id: '6',
    icon: Clock,
    title: 'Posts scheduled',
    description: '8 posts queued for tomorrow across 4 platforms',
    timestamp: '6 hours ago',
    status: 'pending',
  },
];

const statusColors: Record<ActivityItem['status'], string> = {
  success: 'text-success',
  error: 'text-destructive',
  pending: 'text-warning',
  info: 'text-accent',
};

export function RecentActivity() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25, ease: 'easeOut' }}
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
        <button className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground">
          View all
        </button>
      </div>

      <div className="relative space-y-1">
        {activities.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + idx * 0.06 }}
              className="group flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/40"
            >
              <div className={cn('mt-0.5 shrink-0', statusColors[item.status])}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-foreground">{item.title}</p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{item.timestamp}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{item.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
