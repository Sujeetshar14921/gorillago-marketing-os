'use client';

import { motion } from 'framer-motion';
import {
  Trash2,
  FileEdit,
  Pause,
  Play,
  CheckCircle2,
  Loader2,
  Target,
  DollarSign,
  TrendingUp,
  Image as ImageIcon,
  Rocket,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CampaignAd, AdStatus } from '@/types/database';
import { PLATFORM_META, STATUS_META, OBJECTIVES, BID_STRATEGIES } from './ad-constants';

export interface AdCardProps {
  ad: CampaignAd;
  index: number;
  isLaunching: boolean;
  onLaunch: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onApprove: () => void;
  onActivate: () => void;
  onPause: () => void;
  onArchive: () => void;
}

export function AdCard({
  ad,
  index,
  isLaunching,
  onLaunch,
  onEdit,
  onDelete,
  onApprove,
  onActivate,
  onPause,
  onArchive,
}: AdCardProps) {
  const platform = PLATFORM_META[ad.platform] ?? PLATFORM_META.meta_ads;
  const status = STATUS_META[ad.status] ?? STATUS_META.draft;
  const PlatformIcon = platform.icon;
  const creative = (ad.creative ?? {}) as {
    headline?: string;
    primaryText?: string;
    description?: string;
    cta?: string;
    mediaUrls?: string[];
  };

  const objectiveLabel = OBJECTIVES.find((o) => o.value === ad.objective)?.label ?? ad.objective;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className="group rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left Platform & Info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <PlatformIcon className={`h-5 w-5 ${platform.color}`} />
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">{platform.label}</span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${status.bg} ${status.color}`}>
                {status.label}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                <Target className="h-2.5 w-2.5" />
                {objectiveLabel}
              </span>
            </div>

            {/* Delivery badge */}
            {ad.external_ad_id && (
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md w-fit">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span>Globally Sponsored &bull; <span className="font-mono text-[10px] opacity-80">{ad.external_ad_id}</span></span>
              </div>
            )}

            {/* Error notice */}
            {ad.status === 'failed' && ad.error_message && (
              <div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 border border-destructive/20 px-2 py-1 rounded-md">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span className="text-[11px] truncate">{ad.error_message}</span>
              </div>
            )}

            {/* Creative preview */}
            {creative.headline && (
              <p className="text-sm font-medium text-foreground line-clamp-1">{creative.headline}</p>
            )}
            {creative.primaryText && (
              <p className="text-xs text-muted-foreground line-clamp-2">{creative.primaryText}</p>
            )}

            {/* Budget info */}
            <div className="flex items-center gap-3 flex-wrap text-[10px] text-muted-foreground pt-0.5">
              {ad.daily_budget != null && (
                <span className="flex items-center gap-0.5">
                  <DollarSign className="h-2.5 w-2.5" />
                  ${ad.daily_budget.toLocaleString()}/day
                </span>
              )}
              {ad.lifetime_budget != null && (
                <span className="flex items-center gap-0.5">
                  <TrendingUp className="h-2.5 w-2.5" />
                  ${ad.lifetime_budget.toLocaleString()} lifetime
                </span>
              )}
              <span>Bid: {BID_STRATEGIES.find((b) => b.value === ad.bid_strategy)?.label ?? ad.bid_strategy}</span>
              {creative.mediaUrls && creative.mediaUrls.length > 0 && (
                <span className="flex items-center gap-0.5">
                  <ImageIcon className="h-2.5 w-2.5" />
                  {creative.mediaUrls.length} creative{creative.mediaUrls.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
          {ad.status !== 'active' ? (
            <Button
              size="sm"
              onClick={onLaunch}
              disabled={isLaunching}
              className="h-8 px-3 text-xs gap-1.5 bg-gradient-to-r from-accent to-purple-600 text-white shadow-sm hover:opacity-90 font-medium"
            >
              {isLaunching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Rocket className="h-3.5 w-3.5" />
              )}
              {ad.status === 'failed' ? 'Retry Launch' : 'Launch to Feeds'}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={onLaunch}
              disabled={isLaunching}
              className="h-8 px-2.5 text-xs gap-1 text-muted-foreground hover:text-foreground border-emerald-500/30"
              title="Re-synchronize with ad network"
            >
              {isLaunching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 text-emerald-600" />
              )}
              Re-sync
            </Button>
          )}

          <div className="flex items-center gap-0.5">
            {ad.status === 'pending_approval' && (
              <Button size="sm" variant="ghost" onClick={onApprove} className="h-8 px-2 text-xs gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                Approve
              </Button>
            )}
            {ad.status === 'approved' && (
              <Button size="sm" variant="ghost" onClick={onActivate} className="h-8 px-2 text-xs gap-1 text-emerald-600">
                <Play className="h-3.5 w-3.5" />
                Activate
              </Button>
            )}
            {ad.status === 'active' && (
              <Button size="sm" variant="ghost" onClick={onPause} className="h-8 px-2 text-xs gap-1 text-orange-600">
                <Pause className="h-3.5 w-3.5" />
                Pause
              </Button>
            )}
            {ad.status === 'paused' && (
              <Button size="sm" variant="ghost" onClick={onActivate} className="h-8 px-2 text-xs gap-1 text-emerald-600">
                <Play className="h-3.5 w-3.5" />
                Resume
              </Button>
            )}
            {(ad.status === 'active' || ad.status === 'paused') && (
              <Button size="sm" variant="ghost" onClick={onArchive} className="h-8 px-2 text-xs gap-1">
                Archive
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onEdit} className="h-8 w-8 p-0" title="Edit Ad">
              <FileEdit className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onDelete} className="h-8 w-8 p-0" title="Delete Ad">
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
