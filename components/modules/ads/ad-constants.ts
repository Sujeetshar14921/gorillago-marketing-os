import { Facebook, Globe, Linkedin, Image as ImageIcon, Twitter } from 'lucide-react';
import type { AdPlatform, AdStatus, AdObjective, BidStrategy } from '@/types/database';

export const PLATFORM_META: Record<AdPlatform, { label: string; icon: typeof Facebook; color: string }> = {
  meta_ads: { label: 'Meta Ads', icon: Facebook, color: 'text-blue-600' },
  google_ads: { label: 'Google Ads', icon: Globe, color: 'text-emerald-600' },
  linkedin_ads: { label: 'LinkedIn Ads', icon: Linkedin, color: 'text-blue-700' },
  pinterest_ads: { label: 'Pinterest Ads', icon: ImageIcon, color: 'text-red-600' },
  x_ads: { label: 'X Ads', icon: Twitter, color: 'text-foreground' },
};

export const STATUS_META: Record<AdStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: 'text-muted-foreground', bg: 'bg-muted' },
  pending_approval: { label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-500/10' },
  approved: { label: 'Approved', color: 'text-blue-600', bg: 'bg-blue-500/10' },
  active: { label: 'Active', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  paused: { label: 'Paused', color: 'text-orange-600', bg: 'bg-orange-500/10' },
  archived: { label: 'Archived', color: 'text-muted-foreground', bg: 'bg-muted' },
  failed: { label: 'Failed', color: 'text-destructive', bg: 'bg-destructive/10' },
};

export const OBJECTIVES: { value: AdObjective; label: string }[] = [
  { value: 'awareness', label: 'Awareness' },
  { value: 'reach', label: 'Reach' },
  { value: 'traffic', label: 'Traffic' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'leads', label: 'Leads' },
  { value: 'app_installs', label: 'App Installs' },
  { value: 'video_views', label: 'Video Views' },
  { value: 'conversions', label: 'Conversions' },
  { value: 'store_traffic', label: 'Store Traffic' },
  { value: 'sales', label: 'Sales' },
];

export const BID_STRATEGIES: { value: BidStrategy; label: string }[] = [
  { value: 'lowest_cost', label: 'Lowest Cost' },
  { value: 'cost_cap', label: 'Cost Cap' },
  { value: 'bid_cap', label: 'Bid Cap' },
  { value: 'target_cost', label: 'Target Cost' },
];

export const PLATFORMS = Object.keys(PLATFORM_META) as AdPlatform[];
export const STATUS_FILTERS: (AdStatus | 'all')[] = ['all', 'draft', 'pending_approval', 'approved', 'active', 'paused', 'failed'];
