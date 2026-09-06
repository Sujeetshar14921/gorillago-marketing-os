'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  collapsed?: boolean;
}

export function Logo({ className, showText = true, collapsed = false }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-accent/50 p-1"
      >
        <img src="/gorilla.png" alt="GorillaGO" className="h-full w-full object-contain" />
      </motion.div>
      {showText && !collapsed && (
        <div className="flex flex-col leading-none">
          <span className="text-sm font-bold tracking-tight text-foreground">
            GorillaGO
          </span>
          <span className="text-[10px] font-medium text-muted-foreground">
            Growth OS
          </span>
        </div>
      )}
    </div>
  );
}
