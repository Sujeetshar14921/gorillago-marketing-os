'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Plus, Search, Filter, Sparkles } from 'lucide-react';
import { useAds, useUpdateAd, useDeleteAd, useLaunchAd } from '@/hooks/use-ads';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { CampaignAd, AdPlatform, AdStatus } from '@/types/database';
import { AdMetrics } from '@/components/modules/ads/ad-metrics';
import { AdCard } from '@/components/modules/ads/ad-card';
import { CreateAdModal } from '@/components/modules/ads/create-ad-modal';
import { PLATFORMS, PLATFORM_META, STATUS_FILTERS, STATUS_META } from '@/components/modules/ads/ad-constants';

export default function AdsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [showBuilder, setShowBuilder] = useState(false);
  const [editAd, setEditAd] = useState<CampaignAd | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CampaignAd | null>(null);
  const [approveTarget, setApproveTarget] = useState<CampaignAd | null>(null);
  const [launchingId, setLaunchingId] = useState<string | null>(null);

  const { data: ads, isLoading } = useAds({
    search: search || undefined,
    status: statusFilter as AdStatus | 'all',
    platform: platformFilter as AdPlatform | 'all',
  });
  const updateAd = useUpdateAd();
  const deleteAd = useDeleteAd();
  const launchAd = useLaunchAd();

  const handleLaunch = async (ad: CampaignAd) => {
    setLaunchingId(ad.id);
    try {
      const res = await launchAd.mutateAsync(ad.id);
      toast({
        title: 'Ad Globally Sponsored!',
        description: res.delivery?.message || `Live as official Sponsored post on customer feeds (Est. reach: ${(res.delivery?.audienceReachEstimate || 5000).toLocaleString()} impressions/day).`,
      });
    } catch (err: any) {
      toast({
        title: 'Ad Launch Failed',
        description: err?.message || 'Failed to dispatch ad to customer feeds',
        variant: 'destructive',
      });
    } finally {
      setLaunchingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAd.mutateAsync(deleteTarget.id);
      toast({ title: 'Ad deleted' });
      setDeleteTarget(null);
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleApprove = async () => {
    if (!approveTarget) return;
    try {
      await updateAd.mutateAsync({ id: approveTarget.id, status: 'approved' });
      toast({ title: 'Ad approved' });
      setApproveTarget(null);
    } catch {
      toast({ title: 'Failed to approve', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (ad: CampaignAd, newStatus: AdStatus) => {
    try {
      await updateAd.mutateAsync({ id: ad.id, status: newStatus });
      toast({ title: `Ad ${newStatus === 'active' ? 'activated' : newStatus === 'paused' ? 'paused' : 'archived'}` });
    } catch {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Paid Advertising</h1>
        <p className="text-sm text-muted-foreground">
          Create, launch, and optimize ad campaigns across Meta, Google, LinkedIn, Pinterest, and X.
        </p>
      </motion.div>

      {/* Global Agency Ad Banner */}
      <div className="relative overflow-hidden rounded-xl border border-accent/30 bg-gradient-to-r from-accent/10 via-purple-500/10 to-blue-500/10 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <h3 className="font-semibold text-foreground">Global Sponsored Ad Delivery (.env API Active)</h3>
              <Badge className="bg-accent text-white hover:bg-accent text-[10px]">Zero User Ad Accounts Needed</Badge>
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl">
              All ads launched here are automatically dispatched as <strong>official &quot;Sponsored&quot; posts</strong> directly into target customer feeds, stories, and reels across Meta, Google, LinkedIn, X, and Pinterest via GorillaGo&apos;s master agency API (.env).
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Globally Sponsored Network Active
          </div>
        </div>
      </div>

      <AdMetrics />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ads..."
            className="h-9 pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[130px]">
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'all' ? 'All statuses' : STATUS_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All platforms</SelectItem>
            {PLATFORMS.map((p) => (
              <SelectItem key={p} value={p}>{PLATFORM_META[p].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setShowBuilder(true)} className="gap-1.5 bg-accent text-white hover:bg-accent/90">
          <Plus className="h-4 w-4" />
          New Ad
        </Button>
      </div>

      {/* Ads List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : !ads || ads.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
            <Megaphone className="h-7 w-7 text-accent" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No ads yet</h3>
          <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
            Create your first ad campaign and start reaching your target audience.
          </p>
          <Button onClick={() => setShowBuilder(true)} className="mt-4 gap-1.5 bg-accent text-white hover:bg-accent/90">
            <Plus className="h-4 w-4" />
            Create Ad
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {(ads as CampaignAd[]).map((ad, idx) => (
            <AdCard
              key={ad.id}
              ad={ad}
              index={idx}
              isLaunching={launchingId === ad.id}
              onLaunch={() => handleLaunch(ad)}
              onEdit={() => setEditAd(ad)}
              onDelete={() => setDeleteTarget(ad)}
              onApprove={() => setApproveTarget(ad)}
              onActivate={() => handleStatusChange(ad, 'active')}
              onPause={() => handleStatusChange(ad, 'paused')}
              onArchive={() => handleStatusChange(ad, 'archived')}
            />
          ))}
        </div>
      )}

      {/* Create & Edit Modals */}
      <CreateAdModal open={showBuilder} onClose={() => setShowBuilder(false)} />
      <CreateAdModal open={!!editAd} ad={editAd} onClose={() => setEditAd(null)} />

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this ad?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the ad configuration. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve dialog */}
      <AlertDialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this ad?</AlertDialogTitle>
            <AlertDialogDescription>
              The ad will be marked as approved and ready to activate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>Approve</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
