'use client';

import { motion } from 'framer-motion';
import { PenSquare, Image as ImageIcon, Video, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BillingCredits } from '@/types/database';

export interface CreditsOverviewCardProps {
  credits: BillingCredits | null;
  onBuyCredits: () => void;
}

export function CreditsOverviewCard({ credits, onBuyCredits }: CreditsOverviewCardProps) {
  const contentCredits = credits?.ai_content_credits ?? 10;
  const imageCredits = credits?.ai_image_credits ?? 2;
  const videoCredits = credits?.ai_video_credits ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      className="flex flex-col justify-between rounded-xl border border-border bg-card p-5"
    >
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI Generation Quotas</h3>
            <p className="mt-1 text-xs text-muted-foreground">Active credits ready to generate campaigns & creatives</p>
          </div>
          <Button
            size="sm"
            onClick={onBuyCredits}
            className="h-8 bg-accent text-white hover:bg-accent/90 text-xs gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Add Credits
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-muted/40 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <PenSquare className="h-3.5 w-3.5 text-accent" />
              <span>Content</span>
            </div>
            <p className="text-xl font-bold text-foreground">{contentCredits}</p>
          </div>

          <div className="rounded-lg bg-muted/40 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ImageIcon className="h-3.5 w-3.5 text-accent" />
              <span>Images</span>
            </div>
            <p className="text-xl font-bold text-foreground">{imageCredits}</p>
          </div>

          <div className="rounded-lg bg-muted/40 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Video className="h-3.5 w-3.5 text-accent" />
              <span>Videos</span>
            </div>
            <p className="text-xl font-bold text-foreground">{videoCredits}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
        <span>Zero-Deduction AI Guardrails active</span>
        <span className="text-emerald-600 font-medium">Auto-renew enabled</span>
      </div>
    </motion.div>
  );
}
