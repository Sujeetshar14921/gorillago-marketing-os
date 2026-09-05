'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Rocket, Zap, Bot, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  label: string;
  description: string;
  icon: typeof Rocket;
  href: string;
  accent: string;
}

const actions: QuickAction[] = [
  {
    label: 'Launch AI Campaign Wizard',
    description: 'Product + budget + goal → full campaign',
    icon: Rocket,
    href: '/dashboard/assistant',
    accent: 'from-accent to-chart-2',
  },
  {
    label: 'Generate Content',
    description: 'AI captions, ads, emails, blogs',
    icon: Zap,
    href: '/dashboard/content-studio',
    accent: 'from-chart-2 to-chart-3',
  },
  {
    label: 'Ask AI Assistant',
    description: 'Chat with your marketing AI',
    icon: Bot,
    href: '/dashboard/assistant',
    accent: 'from-chart-3 to-chart-4',
  },
];

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
    >
      {actions.map((action, idx) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.label}
            href={action.href}
            prefetch={true}
            className="block"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: 0.35 + idx * 0.08 }}
              whileHover={{ y: -2 }}
              className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-accent/30 hover:shadow-md cursor-pointer"
            >
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br', action.accent)}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">{action.label}</p>
                <p className="truncate text-[11px] text-muted-foreground">{action.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-accent" />
            </motion.div>
          </Link>
        );
      })}
    </motion.div>
  );
}
