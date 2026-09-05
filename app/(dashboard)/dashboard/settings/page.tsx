'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Palette,
  Settings as SettingsIcon,
  Bot,
  Bell,
  Save,
  Loader2,
  Building2,
  Globe,
  Sparkles,
  Zap,
  Shield,
  Share2,
  Link2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Unlink,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  ShieldCheck,
  Plus,
  ChevronDown,
  ChevronUp,
  Key,
  Users,
  Package,
  CreditCard,
  HelpCircle,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { useBrand, useUpsertBrand } from '@/hooks/use-brands';
import { useOrgSettings, useUpdateOrgSettings } from '@/hooks/use-settings';
import { useOrganization } from '@/hooks/use-organization';
import {
  useSocialAccounts,
  useManualConnectSocialAccount,
  useDisconnectSocialAccount,
  useCheckSocialAccountHealth,
} from '@/hooks/use-social-accounts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import type { SocialPlatform, SocialAccount } from '@/types/database';

const TONE_OPTIONS = [
  'professional',
  'playful',
  'luxury',
  'casual',
  'authoritative',
  'friendly',
  'inspirational',
  'witty',
];

const AI_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o (Recommended)' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Economic)' },
  { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku (Fast)' },
];

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
];

const COLOR_PRESETS = [
  { name: 'Ocean', primary: '#0EA5E9', secondary: '#6366F1', accent: '#06B6D4' },
  { name: 'Sunset', primary: '#F97316', secondary: '#EC4899', accent: '#F59E0B' },
  { name: 'Forest', primary: '#10B981', secondary: '#059669', accent: '#84CC16' },
  { name: 'Royal', primary: '#1E3A8A', secondary: '#1E40AF', accent: '#3B82F6' },
  { name: 'Mono', primary: '#18181B', secondary: '#3F3F46', accent: '#71717A' },
  { name: 'Coral', primary: '#EF4444', secondary: '#F43F5E', accent: '#FB7185' },
];

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'brand';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure your brand identity, connected social & ad platforms, AI preferences, and workspace settings.
        </p>
      </motion.div>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="brand" className="gap-1.5">
            <Palette className="h-3.5 w-3.5" />
            Brand
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-1.5">
            <Share2 className="h-3.5 w-3.5" />
            Social Accounts
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-1.5">
            <SettingsIcon className="h-3.5 w-3.5" />
            General
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-1.5">
            <Bot className="h-3.5 w-3.5" />
            AI Preferences
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="workspace" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Workspace
          </TabsTrigger>
        </TabsList>

        <TabsContent value="brand" className="mt-4">
          <BrandSettings />
        </TabsContent>
        <TabsContent value="profile" className="mt-4">
          <ProfileSettings />
        </TabsContent>
        <TabsContent value="integrations" className="mt-4">
          <IntegrationsSettings />
        </TabsContent>
        <TabsContent value="general" className="mt-4">
          <GeneralSettings />
        </TabsContent>
        <TabsContent value="ai" className="mt-4">
          <AISettings />
        </TabsContent>
        <TabsContent value="notifications" className="mt-4">
          <NotificationSettings />
        </TabsContent>
        <TabsContent value="workspace" className="mt-4">
          <WorkspaceSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// INTEGRATIONS & SOCIAL ACCOUNTS SETTINGS (PHASE 4)
// ============================================================

interface PlatformCardConfig {
  id: string;
  name: string;
  category: 'social';
  platformKey: SocialPlatform;
  description: string;
  icon: typeof Facebook;
  color: string;
  bgLight: string;
}

const INTEGRATION_PLATFORMS: PlatformCardConfig[] = [
  {
    id: 'facebook',
    name: 'Meta / Facebook Page',
    category: 'social',
    platformKey: 'facebook',
    description: 'Publish posts, videos, and updates directly to your Facebook brand page.',
    icon: Facebook,
    color: 'text-blue-600',
    bgLight: 'bg-blue-500/10',
  },
  {
    id: 'instagram',
    name: 'Instagram Business',
    category: 'social',
    platformKey: 'instagram',
    description: 'Auto-publish images, carousels, and reels to your connected Instagram account.',
    icon: Instagram,
    color: 'text-rose-500',
    bgLight: 'bg-rose-500/10',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Profile & Pages',
    category: 'social',
    platformKey: 'linkedin',
    description: 'Publish B2B thought leadership articles and organic corporate updates.',
    icon: Linkedin,
    color: 'text-blue-700',
    bgLight: 'bg-blue-700/10',
  },
  {
    id: 'x',
    name: 'X (formerly Twitter)',
    category: 'social',
    platformKey: 'x',
    description: 'Broadcast viral threads, product announcements, and quick organic updates.',
    icon: Twitter,
    color: 'text-foreground',
    bgLight: 'bg-muted',
  },
  {
    id: 'youtube',
    name: 'YouTube Channel',
    category: 'social',
    platformKey: 'youtube',
    description: 'Upload generated short clips and long-form video campaigns.',
    icon: Youtube,
    color: 'text-red-500',
    bgLight: 'bg-red-500/10',
  },
];

function IntegrationsSettings() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const { data: userOrg } = useOrganization();
  const { data: socialAccounts, isLoading: loadingSocial } = useSocialAccounts();

  const manualConnectSocial = useManualConnectSocialAccount();
  const disconnectSocial = useDisconnectSocialAccount();
  const checkHealthSocial = useCheckSocialAccountHealth();

  const [testingId, setTestingId] = useState<string | null>(null);
  const [modalPlatform, setModalPlatform] = useState<PlatformCardConfig | null>(null);
  const [customName, setCustomName] = useState('');

  // Toast for URL query params (OAuth return)
  useEffect(() => {
    const connected = searchParams.get('connected');
    const platform = searchParams.get('platform');
    const unconfigured = searchParams.get('unconfigured');
    const errorParam = searchParams.get('error');

    if (connected === 'true') {
      toast({
        title: 'Platform Connected!',
        description: `Successfully linked ${platform ? platform.toUpperCase() : 'account'} via OAuth.`,
      });
    } else if (unconfigured) {
      toast({
        title: 'OAuth Live Keys Pending',
        description: `Live client ID for ${unconfigured} is not configured in .env. You can use Sandbox Instant Connect to test.`,
        variant: 'destructive',
      });
    } else if (errorParam) {
      toast({
        title: 'Connection Notice',
        description: decodeURIComponent(errorParam),
        variant: 'destructive',
      });
    }
  }, [searchParams, toast]);

  const handleOpenConnect = (platform: PlatformCardConfig) => {
    setModalPlatform(platform);
    setCustomName(`${userOrg?.org.name ?? 'My Brand'} ${platform.name}`);
  };

  const handleFastConnectSandbox = async () => {
    if (!modalPlatform || !userOrg?.org.id) return;
    try {
      await manualConnectSocial.mutateAsync({
        platform: modalPlatform.platformKey,
        accountName: customName || `${modalPlatform.name} (Sandbox)`,
        isSandbox: true,
      });
      toast({
        title: 'Sandbox Account Connected',
        description: `Verified connection established for ${modalPlatform.name}.`,
      });
      setModalPlatform(null);
    } catch (err: any) {
      toast({
        title: 'Connection Failed',
        description: err?.message || 'Could not connect sandbox account',
        variant: 'destructive',
      });
    }
  };

  const handleTriggerOAuth = (platform: PlatformCardConfig) => {
    if (!userOrg?.org.id) return;
    const url = `/api/auth/oauth/${platform.platformKey}/authorize?orgId=${userOrg.org.id}&redirectPath=/dashboard/settings?tab=integrations`;
    window.location.href = url;
  };

  const handleTestHealth = async (item: { id: string }) => {
    setTestingId(item.id);
    try {
      const health = await checkHealthSocial.mutateAsync(item.id);
      toast({
        title: health.healthy ? 'Connection Verified' : 'Token Expired',
        description: health.message || (health.healthy ? 'Active and healthy.' : 'Needs re-authentication.'),
        variant: health.healthy ? 'default' : 'destructive',
      });
    } catch (err: any) {
      toast({
        title: 'Health Check Failed',
        description: err?.message || 'Could not verify token health',
        variant: 'destructive',
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleDisconnect = async (item: { id: string; name: string }) => {
    try {
      await disconnectSocial.mutateAsync({ accountId: item.id });
      toast({
        title: 'Account Disconnected',
        description: `${item.name} has been disconnected.`,
      });
    } catch (err: any) {
      toast({
        title: 'Failed to disconnect',
        description: err?.message || 'Action failed',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-accent" />
              <h3 className="font-semibold text-foreground">Personal & Brand Social Accounts</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Connect your personal or brand social profiles with 1-click to auto-publish organic posts, videos, and reels directly to your accounts.
            </p>
          </div>
          <Badge variant="outline" className="shrink-0 text-[11px] font-medium text-emerald-500 border-emerald-500/30">
            Zero API Setup Required
          </Badge>
        </div>
      </div>

      {/* Global Ad Network Callout */}
      <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-accent" /> Agency Master Ad Infrastructure Active (.env API Connected)
          </h4>
          <p className="text-xs text-muted-foreground max-w-2xl">
            All paid ad campaigns in the <strong>Paid Advertising</strong> studio run globally as <strong>&quot;Sponsored&quot; posts</strong> across customer feeds (Meta, Google, LinkedIn) powered directly by GorillaGo&apos;s master agency cloud API (.env). <strong>You never need to set up personal ad accounts or developer keys.</strong> Simply connect your social profiles below to manage organic posts.
          </p>
        </div>
        <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] shrink-0">
          Globally Sponsored (.env)
        </Badge>
      </div>

      {/* Social Platforms Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold tracking-wide text-foreground uppercase">
            Personal / Brand Channels
          </h4>
          <span className="text-xs text-muted-foreground">
            Used for automatic post scheduling & instant publishing
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {INTEGRATION_PLATFORMS.map((p) => {
            const PIcon = p.icon;
            const connectedAccount = (socialAccounts ?? []).find(
              (acc: SocialAccount) => acc.platform === p.platformKey
            );

            const isConnected = Boolean(connectedAccount && connectedAccount.is_connected);
            const isHealthy = connectedAccount?.health_status === 'healthy';
            const isTesting = testingId === connectedAccount?.id;

            return (
              <div
                key={p.id}
                className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-sidebar-hover"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${p.bgLight}`}>
                        <PIcon className={`h-5 w-5 ${p.color}`} />
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-foreground">{p.name}</h5>
                        <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>
                      </div>
                    </div>
                    {isConnected ? (
                      <Badge
                        variant="secondary"
                        className={`shrink-0 text-[10px] font-medium ${
                          isHealthy
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}
                      >
                        {isHealthy ? 'Healthy' : 'Expired'}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0 text-[10px] text-muted-foreground">
                        Not Connected
                      </Badge>
                    )}
                  </div>

                  {isConnected && connectedAccount && (
                    <div className="rounded-lg bg-muted/40 p-2.5 text-xs space-y-1">
                      <div className="flex items-center justify-between font-medium text-foreground">
                        <span>{connectedAccount.account_name}</span>
                        {connectedAccount.metadata?.is_sandbox ? (
                          <span className="text-[10px] text-accent font-semibold">SANDBOX</span>
                        ) : null}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        ID: {connectedAccount.account_id}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-end gap-2 border-t border-border/50 pt-3">
                  {isConnected && connectedAccount ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestHealth(connectedAccount)}
                        disabled={isTesting}
                        className="h-8 gap-1.5 text-xs"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                        Test Health
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleDisconnect({ id: connectedAccount.id, name: connectedAccount.account_name })
                        }
                        className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Unlink className="h-3.5 w-3.5" />
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleOpenConnect(p)}
                      className="h-8 gap-1.5 bg-accent text-white hover:bg-accent/90 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Connect Dialog */}
      <Dialog open={Boolean(modalPlatform)} onOpenChange={(open) => !open && setModalPlatform(null)}>
        <DialogContent className="max-w-md">
          {modalPlatform && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${modalPlatform.bgLight}`}>
                    <modalPlatform.icon className={`h-4 w-4 ${modalPlatform.color}`} />
                  </div>
                  <DialogTitle>Connect {modalPlatform.name}</DialogTitle>
                </div>
                <DialogDescription>
                  1-Click Connection &bull; No API Keys Required
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* Zero API Keys Explanation Banner */}
                <div className="rounded-lg bg-accent/10 border border-accent/20 p-3 text-xs text-foreground/90 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-accent">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Personal Account Connection</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Connect your account with 1-click so GorillaGo can publish posts directly to your profile. You <strong>never need to provide API keys or developer secrets</strong>.
                  </p>
                </div>

                {/* Primary Action 1: 1-Click Official Social OAuth */}
                <div className="space-y-2">
                  <Button
                    onClick={() => handleTriggerOAuth(modalPlatform)}
                    className="w-full bg-accent text-white hover:bg-accent/90 py-5 text-xs font-semibold gap-2 shadow-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Continue with {modalPlatform.name} (1-Click OAuth)
                  </Button>
                  <p className="text-[11px] text-center text-muted-foreground">
                    Redirects to official authorization. GorillaGo never sees or stores your password.
                  </p>
                </div>

                {/* Divider */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-border"></div>
                  <span className="flex-shrink mx-3 text-[10px] uppercase tracking-wider text-muted-foreground">Or</span>
                  <div className="flex-grow border-t border-border"></div>
                </div>

                {/* Primary Action 2: Instant Sandbox Mode */}
                <div className="rounded-lg border border-border/80 bg-muted/30 p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-accent" /> Instant Sandbox Mode
                    </span>
                    <Badge variant="outline" className="text-[10px]">No login needed</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Test scheduling and publishing immediately with a verified simulated profile.
                  </p>
                  <div className="space-y-1.5">
                    <Label className="text-[11px]">Account / Brand Label</Label>
                    <Input
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. Acme Corp Brand"
                      className="text-xs h-8"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleFastConnectSandbox}
                    disabled={manualConnectSocial.isPending}
                    className="w-full h-8 text-xs gap-1.5 border-accent/30 hover:bg-accent/10"
                  >
                    {manualConnectSocial.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    )}
                    Connect Sandbox Profile Instantly
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// BRAND SETTINGS
// ============================================================

function BrandSettings() {
  const { toast } = useToast();
  const { data: brand, isLoading } = useBrand();
  const upsertBrand = useUpsertBrand();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0EA5E9');
  const [secondaryColor, setSecondaryColor] = useState('#6366F1');
  const [accentColor, setAccentColor] = useState('#06B6D4');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [toneOfVoice, setToneOfVoice] = useState('professional');
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    if (brand) {
      setName(brand.name ?? '');
      setDescription(brand.description ?? '');
      setLogoUrl(brand.logo_url ?? '');
      setPrimaryColor(brand.primary_color ?? '#0EA5E9');
      setSecondaryColor(brand.secondary_color ?? '#6366F1');
      setAccentColor(brand.accent_color ?? '#06B6D4');
      setFontFamily(brand.font_family ?? 'Inter');
      setToneOfVoice(brand.tone_of_voice ?? 'professional');
      setLanguage(brand.language ?? 'en');
    }
  }, [brand]);

  const handlePresetSelect = (preset: (typeof COLOR_PRESETS)[0]) => {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
    setAccentColor(preset.accent);
  };

  const handleSave = async () => {
    try {
      await upsertBrand.mutateAsync({
        name: name.trim() || 'My Brand',
        description: description.trim() || null,
        logo_url: logoUrl.trim() || null,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        accent_color: accentColor,
        font_family: fontFamily,
        tone_of_voice: toneOfVoice,
        language,
      });
      toast({ title: 'Brand settings saved', description: 'Your brand identity has been updated.' });
    } catch {
      toast({ title: 'Failed to save', description: 'Could not update brand settings.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SettingsCard title="Brand Identity" description="Basic information about your brand.">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="brand-name">Brand Name</Label>
            <Input id="brand-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Corp" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="brand-desc">Description</Label>
            <Textarea
              id="brand-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does your brand do? This helps AI generate on-brand content."
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="brand-logo">Logo URL</Label>
            <Input id="brand-logo" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Color Palette" description="Define your brand colors. These will be used in previews and creative assets.">
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Color Presets</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs transition-colors hover:bg-muted"
                >
                  <div className="flex gap-1">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: preset.primary }} />
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: preset.secondary }} />
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: preset.accent }} />
                  </div>
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ColorInput label="Primary" value={primaryColor} onChange={setPrimaryColor} />
            <ColorInput label="Secondary" value={secondaryColor} onChange={setSecondaryColor} />
            <ColorInput label="Accent" value={accentColor} onChange={setAccentColor} />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Voice & Language" description="Set the tone and default language for AI-generated content.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Tone of Voice</Label>
            <Select value={toneOfVoice} onValueChange={setToneOfVoice}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Default Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsCard>

      <SaveButton onSave={handleSave} loading={upsertBrand.isPending} />
    </div>
  );
}

// ============================================================
// GENERAL SETTINGS
// ============================================================

function GeneralSettings() {
  const { toast } = useToast();
  const { data: orgSettings, isLoading } = useOrgSettings();
  const updateSettings = useUpdateOrgSettings();

  const [timezone, setTimezone] = useState('UTC');
  const [defaultLanguage, setDefaultLanguage] = useState('en');

  useEffect(() => {
    if (orgSettings) {
      setTimezone(orgSettings.timezone ?? 'UTC');
      setDefaultLanguage(orgSettings.default_language ?? 'en');
    }
  }, [orgSettings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        timezone,
        default_language: defaultLanguage,
      });
      toast({ title: 'Settings saved', description: 'General settings have been updated.' });
    } catch {
      toast({ title: 'Failed to save', description: 'Could not update general settings.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SettingsCard title="Localization" description="Timezone and regional settings for scheduling and reporting.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>System Language</Label>
            <Select value={defaultLanguage} onValueChange={setDefaultLanguage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsCard>

      <SaveButton onSave={handleSave} loading={updateSettings.isPending} />
    </div>
  );
}

function ProfileSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFullName(user?.user_metadata?.full_name ?? '');
    setEmail(user?.email ?? '');
  }, [user]);

  const handleSave = async () => {
    if (!fullName.trim() || !email.trim()) {
      toast({ title: 'Name and email are required', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({
        email: email.trim(),
        data: { full_name: fullName.trim() },
      });
      if (authError) throw authError;

      const response = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), fullName: fullName.trim() }),
      });
      if (!response.ok) throw new Error('Profile record could not be saved');

      toast({
        title: 'Profile updated',
        description: email.trim() !== user?.email ? 'Check your inbox to confirm the new email address.' : 'Your details are up to date.',
      });
    } catch (error) {
      toast({
        title: 'Could not update profile',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <SettingsCard title="Personal details" description="Keep the name and email used across your GorillaGO workspace up to date.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Full name</Label>
            <Input id="profile-name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your full name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-email">Email address</Label>
            <Input id="profile-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Account safety" description="Your email change may require confirmation before it becomes active.">
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-4">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <p className="text-xs leading-relaxed text-muted-foreground">Use an email address you control. GorillaGO uses it for sign-in, important workspace alerts, and account recovery.</p>
        </div>
      </SettingsCard>

      <SaveButton onSave={handleSave} loading={isSaving} />
    </div>
  );
}

// ============================================================
// AI SETTINGS
// ============================================================

function AISettings() {
  const { toast } = useToast();
  const { data: orgSettings, isLoading } = useOrgSettings();
  const updateSettings = useUpdateOrgSettings();

  const [aiModel, setAiModel] = useState('gpt-4o');
  const [aiTone, setAiTone] = useState('professional');
  const [autoPilotEnabled, setAutoPilotEnabled] = useState(false);
  const [autoPublish, setAutoPublish] = useState(false);
  const [autoAds, setAutoAds] = useState(false);

  useEffect(() => {
    if (orgSettings) {
      setAiModel(orgSettings.ai_model ?? 'gpt-4o');
      setAiTone(orgSettings.ai_tone ?? 'professional');
      setAutoPilotEnabled(orgSettings.auto_pilot_enabled ?? false);
      setAutoPublish(orgSettings.auto_pilot_auto_publish ?? false);
      setAutoAds(orgSettings.auto_pilot_auto_ads ?? false);
    }
  }, [orgSettings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        ai_model: aiModel,
        ai_tone: aiTone,
        auto_pilot_enabled: autoPilotEnabled,
        auto_pilot_auto_publish: autoPublish,
        auto_pilot_auto_ads: autoAds,
      });
      toast({ title: 'AI preferences saved', description: 'Your AI configuration has been updated.' });
    } catch {
      toast({ title: 'Failed to save', description: 'Could not update AI preferences.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SettingsCard title="Model Configuration" description="Choose which AI models power your marketing automation.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Default Text Model</Label>
            <Select value={aiModel} onValueChange={setAiModel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Default Generation Tone</Label>
            <Select value={aiTone} onValueChange={setAiTone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Auto-Pilot Mode" description="Allow AI to automatically schedule posts and optimize ads.">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Enable Auto-Pilot</Label>
              <p className="text-xs text-muted-foreground">AI will generate, schedule, and optimize campaigns autonomously.</p>
            </div>
            <Switch checked={autoPilotEnabled} onCheckedChange={setAutoPilotEnabled} />
          </div>
          {autoPilotEnabled && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium">Auto-Publish Organic Content</Label>
                  <p className="text-[11px] text-muted-foreground">Publish approved organic posts without manual confirmation.</p>
                </div>
                <Switch checked={autoPublish} onCheckedChange={setAutoPublish} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium">Auto-Optimize Paid Ads</Label>
                  <p className="text-[11px] text-muted-foreground">Allow AI to adjust budgets and pause underperforming ad sets.</p>
                </div>
                <Switch checked={autoAds} onCheckedChange={setAutoAds} />
              </div>
            </motion.div>
          )}
        </div>
      </SettingsCard>

      <SaveButton onSave={handleSave} loading={updateSettings.isPending} />
    </div>
  );
}

// ============================================================
// NOTIFICATION SETTINGS
// ============================================================

function NotificationSettings() {
  const { toast } = useToast();
  const { data: orgSettings, isLoading } = useOrgSettings();
  const updateSettings = useUpdateOrgSettings();

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);

  useEffect(() => {
    if (orgSettings) {
      setEmailNotifs(orgSettings.notification_email ?? true);
      setPushNotifs(orgSettings.notification_push ?? false);
    }
  }, [orgSettings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        notification_email: emailNotifs,
        notification_push: pushNotifs,
      });
      toast({ title: 'Notification preferences saved' });
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SettingsCard title="Notification Channels" description="Choose how you receive alerts about campaign performance and AI actions.">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Email Notifications</Label>
              <p className="text-xs text-muted-foreground">Receive weekly digests and critical budget alerts via email.</p>
            </div>
            <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">In-App Notifications</Label>
              <p className="text-xs text-muted-foreground">Show real-time alerts in the notification bell.</p>
            </div>
            <Switch checked={pushNotifs} onCheckedChange={setPushNotifs} />
          </div>
        </div>
      </SettingsCard>

      <SaveButton onSave={handleSave} loading={updateSettings.isPending} />
    </div>
  );
}

function WorkspaceSettings() {
  const workspaceActions = [
    {
      title: 'Manage your team',
      description: 'Invite collaborators and control their roles and access.',
      href: '/dashboard/team',
      icon: Users,
      color: 'text-accent bg-accent/10',
    },
    {
      title: 'Keep product details fresh',
      description: 'Accurate pricing, benefits, and tags improve every AI creative.',
      href: '/dashboard/products',
      icon: Package,
      color: 'text-success bg-success/10',
    },
    {
      title: 'Review plan and credits',
      description: 'See remaining generation credits and choose the right plan.',
      href: '/dashboard/billing',
      icon: CreditCard,
      color: 'text-warning bg-warning/10',
    },
    {
      title: 'Get more from GorillaGO',
      description: 'Find practical answers for campaigns, content, and AI generation.',
      href: '/help',
      icon: HelpCircle,
      color: 'text-chart-2 bg-chart-2/10',
    },
  ];

  return (
    <div className="space-y-6">
      <SettingsCard title="Workspace toolkit" description="Shortcuts that keep your team, catalog, budget, and campaign workflow moving.">
        <div className="grid gap-3 sm:grid-cols-2">
          {workspaceActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.href} className="group rounded-xl border border-border p-4 transition-colors hover:border-accent/50 hover:bg-muted/30">
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${action.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-accent" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">{action.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </SettingsCard>

      <SettingsCard title="Campaign quality checklist" description="Use these habits to improve trust, conversion, and consistency across generated campaigns.">
        <div className="space-y-3 text-sm text-muted-foreground">
          {[
            'Link a product before generating an image, video, or post.',
            'Review price, offer, product claims, and destination links before publishing.',
            'Keep one clear customer action in every creative: Buy, Shop Now, Book, or Learn More.',
            'Approve content only after a human review of the final creative.',
          ].map((item) => (
            <div key={item} className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <Link href="/feedback" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
          <MessageSquare className="h-4 w-4" /> Share workspace feedback
        </Link>
      </SettingsCard>
    </div>
  );
}

// ============================================================
// REUSABLE HELPERS
// ============================================================

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-xs" />
      </div>
    </div>
  );
}

function SaveButton({ onSave, loading }: { onSave: () => void; loading: boolean }) {
  return (
    <div className="flex items-center justify-end">
      <Button onClick={onSave} disabled={loading} className="gap-2 bg-accent text-white hover:bg-accent/90">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Save Changes
          </>
        )}
      </Button>
    </div>
  );
}
