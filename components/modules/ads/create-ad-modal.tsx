'use client';

import { useState, useMemo } from 'react';
import { Plus, FileEdit, Loader2, Megaphone, Target, Image as ImageIcon } from 'lucide-react';
import { useCreateAd, useUpdateAd, usePaidCampaigns } from '@/hooks/use-ads';
import { useCreateCampaign } from '@/hooks/use-campaigns';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
} from '@/components/ui/dialog';
import type { CampaignAd, AdPlatform, AdObjective, BidStrategy, Campaign } from '@/types/database';
import { PLATFORM_META, OBJECTIVES, BID_STRATEGIES, PLATFORMS } from './ad-constants';

export interface CreateAdModalProps {
  open: boolean;
  ad?: CampaignAd | null;
  onClose: () => void;
}

export function CreateAdModal({ open, ad, onClose }: CreateAdModalProps) {
  const { toast } = useToast();
  const { data: campaigns } = usePaidCampaigns();
  const createAd = useCreateAd();
  const updateAd = useUpdateAd();
  const createCampaign = useCreateCampaign();

  const [campaignId, setCampaignId] = useState('');
  const [newCampaignName, setNewCampaignName] = useState('');
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [platform, setPlatform] = useState<AdPlatform>('meta_ads');
  const [objective, setObjective] = useState<AdObjective>('traffic');
  const [dailyBudget, setDailyBudget] = useState('');
  const [lifetimeBudget, setLifetimeBudget] = useState('');
  const [bidStrategy, setBidStrategy] = useState<BidStrategy>('lowest_cost');
  const [headline, setHeadline] = useState('');
  const [primaryText, setPrimaryText] = useState('');
  const [description, setDescription] = useState('');
  const [cta, setCta] = useState('');
  const [mediaUrls, setMediaUrls] = useState('');
  const [ageMin, setAgeMin] = useState('18');
  const [ageMax, setAgeMax] = useState('65');
  const [locations, setLocations] = useState('');
  const [interests, setInterests] = useState('');

  // Reset or populate form when dialog opens
  useMemo(() => {
    if (open) {
      if (ad) {
        setCampaignId(ad.campaign_id);
        setPlatform(ad.platform);
        setObjective(ad.objective);
        setDailyBudget(ad.daily_budget?.toString() ?? '');
        setLifetimeBudget(ad.lifetime_budget?.toString() ?? '');
        setBidStrategy(ad.bid_strategy);
        const c = (ad.creative ?? {}) as { headline?: string; primaryText?: string; description?: string; cta?: string; mediaUrls?: string[] };
        setHeadline(c.headline ?? '');
        setPrimaryText(c.primaryText ?? '');
        setDescription(c.description ?? '');
        setCta(c.cta ?? '');
        setMediaUrls(c.mediaUrls?.join(', ') ?? '');
        const aud = (ad.audience ?? {}) as { ageMin?: number; ageMax?: number; locations?: string[]; interests?: string[] };
        setAgeMin(aud.ageMin?.toString() ?? '18');
        setAgeMax(aud.ageMax?.toString() ?? '65');
        setLocations(aud.locations?.join(', ') ?? '');
        setInterests(aud.interests?.join(', ') ?? '');
      } else {
        setCampaignId(campaigns?.[0]?.id ?? '');
        setPlatform('meta_ads');
        setObjective('traffic');
        setDailyBudget('');
        setLifetimeBudget('');
        setBidStrategy('lowest_cost');
        setHeadline('');
        setPrimaryText('');
        setDescription('');
        setCta('');
        setMediaUrls('');
        setAgeMin('18');
        setAgeMax('65');
        setLocations('');
        setInterests('');
      }
      setShowNewCampaign(false);
      setNewCampaignName('');
    }
  }, [open, ad, campaigns]);

  const handleCreateCampaign = async () => {
    if (!newCampaignName.trim()) return;
    try {
      const c = await createCampaign.mutateAsync({ name: newCampaignName, type: 'paid', goal: 'sales' });
      setCampaignId(c.id);
      setShowNewCampaign(false);
      setNewCampaignName('');
      toast({ title: 'Campaign created!' });
    } catch {
      toast({ title: 'Failed to create campaign', variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    if (!headline.trim() && !primaryText.trim()) {
      toast({ title: 'Please add a headline or primary text', variant: 'destructive' });
      return;
    }

    let finalCampaignId = campaignId;
    if (!finalCampaignId) {
      if (newCampaignName.trim()) {
        try {
          const c = await createCampaign.mutateAsync({ name: newCampaignName, type: 'paid' });
          finalCampaignId = c.id;
        } catch {
          toast({ title: 'Failed to create campaign', variant: 'destructive' });
          return;
        }
      } else {
        toast({ title: 'Please select or create a campaign', variant: 'destructive' });
        return;
      }
    }

    const creativeData = {
      headline: headline || undefined,
      primaryText: primaryText || undefined,
      description: description || undefined,
      cta: cta || undefined,
      mediaUrls: mediaUrls.split(',').map((u) => u.trim()).filter(Boolean),
    };

    const audienceData = {
      ageMin: parseInt(ageMin) || 18,
      ageMax: parseInt(ageMax) || 65,
      locations: locations.split(',').map((l) => l.trim()).filter(Boolean),
      interests: interests.split(',').map((i) => i.trim()).filter(Boolean),
    };

    try {
      if (ad) {
        await updateAd.mutateAsync({
          id: ad.id,
          objective,
          dailyBudget: dailyBudget ? parseFloat(dailyBudget) : undefined,
          lifetimeBudget: lifetimeBudget ? parseFloat(lifetimeBudget) : undefined,
          bidStrategy,
          creative: creativeData,
          audience: audienceData,
        });
        toast({ title: 'Ad updated!' });
      } else {
        await createAd.mutateAsync({
          campaignId: finalCampaignId,
          platform,
          objective,
          dailyBudget: dailyBudget ? parseFloat(dailyBudget) : undefined,
          lifetimeBudget: lifetimeBudget ? parseFloat(lifetimeBudget) : undefined,
          bidStrategy,
          creative: creativeData,
          audience: audienceData,
        });
        toast({ title: 'Ad created!' });
      }
      onClose();
    } catch {
      toast({ title: 'Failed to save ad', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {ad ? <FileEdit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {ad ? 'Edit Ad' : 'Create Ad'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campaign selection */}
          <div className="space-y-1.5">
            <Label className="text-xs">Campaign</Label>
            {showNewCampaign ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  placeholder="Campaign name..."
                  className="h-9 text-xs"
                  autoFocus
                />
                <Button size="sm" onClick={handleCreateCampaign} className="h-9 gap-1 bg-accent text-white hover:bg-accent/90">
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowNewCampaign(false)} className="h-9">
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Select value={campaignId} onValueChange={setCampaignId}>
                  <SelectTrigger className="h-9 text-xs flex-1">
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {(campaigns ?? []).map((c: Campaign) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={() => setShowNewCampaign(true)} className="h-9 gap-1 text-xs">
                  <Plus className="h-3 w-3" />
                  New
                </Button>
              </div>
            )}
          </div>

          {/* Platform & Objective */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Platform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as AdPlatform)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => {
                    const PMeta = PLATFORM_META[p];
                    const PIcon = PMeta.icon;
                    return (
                      <SelectItem key={p} value={p}>
                        <span className="flex items-center gap-1.5">
                          <PIcon className={`h-3 w-3 ${PMeta.color}`} />
                          {PMeta.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Objective</Label>
              <Select value={objective} onValueChange={(v) => setObjective(v as AdObjective)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OBJECTIVES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Budget */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Daily Budget ($)</Label>
              <Input
                type="number"
                value={dailyBudget}
                onChange={(e) => setDailyBudget(e.target.value)}
                placeholder="50"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Lifetime Budget ($)</Label>
              <Input
                type="number"
                value={lifetimeBudget}
                onChange={(e) => setLifetimeBudget(e.target.value)}
                placeholder="1000"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Bid Strategy</Label>
              <Select value={bidStrategy} onValueChange={(v) => setBidStrategy(v as BidStrategy)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BID_STRATEGIES.map((b) => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Creative */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Megaphone className="h-3 w-3" />
              Ad Creative
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs">Headline</Label>
              <Input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Catchy headline..."
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Primary Text</Label>
              <Textarea
                value={primaryText}
                onChange={(e) => setPrimaryText(e.target.value)}
                placeholder="Main ad copy..."
                rows={3}
                className="resize-none text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description..."
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Call to Action</Label>
                <Input
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  placeholder="Shop Now, Learn More..."
                  className="h-9 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Media URLs (comma separated)</Label>
              <Input
                value={mediaUrls}
                onChange={(e) => setMediaUrls(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Audience */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Target className="h-3 w-3" />
              Audience Targeting
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Min Age</Label>
                <Input
                  type="number"
                  value={ageMin}
                  onChange={(e) => setAgeMin(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Max Age</Label>
                <Input
                  type="number"
                  value={ageMax}
                  onChange={(e) => setAgeMax(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Locations (comma separated)</Label>
              <Input
                value={locations}
                onChange={(e) => setLocations(e.target.value)}
                placeholder="US, UK, Canada"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Interests (comma separated)</Label>
              <Input
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="fashion, shopping, lifestyle"
                className="h-9 text-xs"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={createAd.isPending || updateAd.isPending || createCampaign.isPending}
            className="gap-1.5 bg-accent text-white hover:bg-accent/90"
          >
            {(createAd.isPending || updateAd.isPending) && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            {ad ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
