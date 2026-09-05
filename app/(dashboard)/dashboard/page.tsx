'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  DollarSign,
  Eye,
  Target,
  Users,
  ShoppingCart,
  TrendingUp,
  MousePointerClick,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { useAuth } from '@/lib/auth/context';
import { useAnalyticsSnapshots, usePlatformAnalytics } from '@/hooks/use-analytics';
import { useCampaigns } from '@/hooks/use-campaigns';
import { useCampaignPosts } from '@/hooks/use-posts';
import type { AnalyticsSnapshot, Campaign } from '@/types/database';
import { Loader2 } from 'lucide-react';

const DashboardSectionLoading = () => (
  <div className="h-72 animate-pulse rounded-xl border border-border bg-card/60" />
);

const AreaChartCard = dynamic(
  () => import('@/components/dashboard/area-chart-card').then((module) => module.AreaChartCard),
  { loading: DashboardSectionLoading }
);
const BarChartCard = dynamic(
  () => import('@/components/dashboard/bar-chart-card').then((module) => module.BarChartCard),
  { loading: DashboardSectionLoading }
);
const PlatformBreakdown = dynamic(
  () => import('@/components/dashboard/platform-breakdown').then((module) => module.PlatformBreakdown),
  { loading: DashboardSectionLoading }
);
const platformColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

function getRange(daysAgo: number, length: number) {
  const end = new Date();
  end.setDate(end.getDate() - daysAgo);
  const start = new Date(end);
  start.setDate(start.getDate() - length + 1);
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

function sumMetric(snapshots: AnalyticsSnapshot[], key: string) {
  return snapshots.reduce((sum, snapshot) => sum + (snapshot.metrics[key] ?? 0), 0);
}

function formatMetric(value: number, type: 'currency' | 'percent' | 'number' = 'number') {
  if (!value) return type === 'currency' ? '$0' : '0';
  if (type === 'currency') return `$${Math.round(value).toLocaleString()}`;
  if (type === 'percent') return `${value.toFixed(2)}%`;
  return value >= 1000 ? `${(value / 1000).toFixed(value >= 100000 ? 0 : 1)}K` : Math.round(value).toLocaleString();
}

function changeFrom(previous: number, current: number) {
  if (!previous) return current ? 'New' : '0%';
  return `${((current - previous) / previous * 100).toFixed(1)}%`;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [showDeferredSections, setShowDeferredSections] = useState(false);
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';
  const currentRange = getRange(0, 30);
  const previousRange = getRange(30, 30);
  const { data: currentSnapshots = [], isLoading: analyticsLoading } = useAnalyticsSnapshots(currentRange);
  const { data: previousSnapshots = [] } = useAnalyticsSnapshots(previousRange);
  const { data: platformSnapshots = [] } = usePlatformAnalytics(currentRange);
  const { data: campaigns = [], isLoading: campaignsLoading } = useCampaigns();
  const { data: scheduledPosts = [], isLoading: postsLoading } = useCampaignPosts({ status: 'scheduled' });

  const currentRevenue = sumMetric(currentSnapshots, 'revenue');
  const previousRevenue = sumMetric(previousSnapshots, 'revenue');
  const currentSpend = sumMetric(currentSnapshots, 'spend');
  const currentReach = sumMetric(currentSnapshots, 'reach');
  const previousReach = sumMetric(previousSnapshots, 'reach');
  const currentClicks = sumMetric(currentSnapshots, 'clicks');
  const currentImpressions = sumMetric(currentSnapshots, 'impressions');
  const previousClicks = sumMetric(previousSnapshots, 'clicks');
  const previousImpressions = sumMetric(previousSnapshots, 'impressions');
  const currentConversions = sumMetric(currentSnapshots, 'conversions');
  const previousConversions = sumMetric(previousSnapshots, 'conversions');
  const currentCtr = currentImpressions ? currentClicks / currentImpressions * 100 : 0;
  const previousCtr = previousImpressions ? previousClicks / previousImpressions * 100 : 0;
  const roas = currentSpend ? currentRevenue / currentSpend : 0;
  const activeCampaigns = (campaigns as Campaign[]).filter((campaign: Campaign) => campaign.status === 'active').length;
  const platformTotals: Record<string, number> = {};
  (platformSnapshots as AnalyticsSnapshot[]).forEach((snapshot: AnalyticsSnapshot) => {
    const platform = snapshot.platform ?? 'Other';
    platformTotals[platform] = (platformTotals[platform] ?? 0) + (snapshot.metrics.reach ?? 0);
  });
  const platformReach = Object.values(platformTotals).reduce((sum, value) => sum + value, 0);
  const platformData = Object.entries(platformTotals).map(([name, value], index) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: platformReach ? Math.round(value / platformReach * 100) : 0,
    color: platformColors[index % platformColors.length],
  }));
  const revenueData = (currentSnapshots as AnalyticsSnapshot[]).map((snapshot: AnalyticsSnapshot) => ({
    label: snapshot.date.slice(5),
    value: snapshot.metrics.revenue ?? 0,
    value2: snapshot.metrics.spend ?? 0,
  }));
  const engagementData = (currentSnapshots as AnalyticsSnapshot[]).map((snapshot: AnalyticsSnapshot) => ({
    label: snapshot.date.slice(5),
    value: snapshot.metrics.engagement ?? 0,
  }));

  useEffect(() => {
    const loadDeferredSections = () => setShowDeferredSections(true);
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (idleWindow.requestIdleCallback) {
      const idleId = idleWindow.requestIdleCallback(loadDeferredSections);
      return () => idleWindow.cancelIdleCallback?.(idleId);
    }

    const timeoutId = window.setTimeout(loadDeferredSections, 200);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-1"
      >
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {firstName}. Here&apos;s what&apos;s happening across your marketing.
        </p>
      </motion.div>

      <QuickActions />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={analyticsLoading ? '...' : formatMetric(currentRevenue, 'currency')}
          change={analyticsLoading ? '...' : changeFrom(previousRevenue, currentRevenue)}
          trend="up"
          icon={DollarSign}
          accentClass="text-success bg-success/10"
          index={0}
        />
        <StatCard
          label="Total Reach"
          value={analyticsLoading ? '...' : formatMetric(currentReach)}
          change={analyticsLoading ? '...' : changeFrom(previousReach, currentReach)}
          trend="up"
          icon={Eye}
          accentClass="text-accent bg-accent/10"
          index={1}
        />
        <StatCard
          label="ROAS"
          value={analyticsLoading ? '...' : `${roas.toFixed(2)}x`}
          change="Live"
          trend="up"
          icon={Target}
          accentClass="text-chart-2 bg-chart-2/10"
          index={2}
          comparisonLabel="Current period"
        />
        <StatCard
          label="Conversions"
          value={analyticsLoading ? '...' : formatMetric(currentConversions)}
          change={analyticsLoading ? '...' : changeFrom(previousConversions, currentConversions)}
          trend="up"
          icon={Users}
          accentClass="text-chart-3 bg-chart-3/10"
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Ad Spend"
          value={analyticsLoading ? '...' : formatMetric(currentSpend, 'currency')}
          change="Live"
          trend="up"
          icon={ShoppingCart}
          accentClass="text-warning bg-warning/10"
          index={4}
          comparisonLabel="Current period"
        />
        <StatCard
          label="CTR"
          value={analyticsLoading ? '...' : formatMetric(currentCtr, 'percent')}
          change={analyticsLoading ? '...' : changeFrom(previousCtr, currentCtr)}
          trend={currentCtr >= previousCtr ? 'up' : 'down'}
          icon={MousePointerClick}
          accentClass="text-chart-5 bg-chart-5/10"
          index={5}
        />
        <StatCard
          label="Active Campaigns"
          value={campaignsLoading ? '...' : activeCampaigns.toLocaleString()}
          change="Current"
          trend="up"
          icon={TrendingUp}
          accentClass="text-accent bg-accent/10"
          index={6}
          comparisonLabel="Current status"
        />
        <StatCard
          label="Scheduled Posts"
          value={postsLoading ? '...' : scheduledPosts.length.toLocaleString()}
          change="Scheduled"
          trend="up"
          icon={Target}
          accentClass="text-chart-2 bg-chart-2/10"
          index={7}
          comparisonLabel="Current queue"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {showDeferredSections ? (
            <AreaChartCard
              title="Revenue vs Ad Spend"
              data={revenueData}
              dataKeys={[
                { key: 'value', color: 'hsl(var(--chart-1))', label: 'Revenue' },
                { key: 'value2', color: 'hsl(var(--chart-2))', label: 'Ad Spend' },
              ]}
            />
          ) : (
            <DashboardSectionLoading />
          )}
        </div>
        {showDeferredSections ? <PlatformBreakdown data={platformData} totalReach={platformReach} /> : <DashboardSectionLoading />}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {showDeferredSections ? (
          <BarChartCard title="Weekly Engagement" data={engagementData} />
        ) : (
          <DashboardSectionLoading />
        )}
        {showDeferredSections ? (
          <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-foreground">Live campaign activity</h3>
            <p className="mt-1 text-xs text-muted-foreground">Current organization data from campaigns and scheduled posts.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-muted/30 p-4"><p className="text-xs text-muted-foreground">Active campaigns</p><p className="mt-1 text-2xl font-bold text-foreground">{activeCampaigns}</p></div>
              <div className="rounded-lg bg-muted/30 p-4"><p className="text-xs text-muted-foreground">Scheduled posts</p><p className="mt-1 text-2xl font-bold text-foreground">{scheduledPosts.length}</p></div>
            </div>
          </div>
        ) : <DashboardSectionLoading />}
      </div>
    </div>
  );
}
