'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  Sparkles,
  Loader2,
  Trash2,
  Search,
  Film,
  Play,
  Square,
  Mic2,
  Music,
  Type,
  Watch,
  MonitorPlay,
  Captions,
  Wand2,
  Package,
  Filter,
  Download,
  Copy,
  Check,
  Clock,
  Ratio,
  Zap,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { useCredits } from '@/hooks/use-billing';
import { useVideoAssets, useGenerateVideo, useDeleteMediaAsset, useUploadMediaAsset } from '@/hooks/use-media-assets';
import { useProducts } from '@/hooks/use-products';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
} from '@/components/ui/dialog';
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
import type { MediaCategory, MediaAsset } from '@/types/database';

interface VideoTypeInfo {
  label: string;
  icon: typeof Video;
  color: string;
  desc: string;
  aspect: string;
  defaultDuration: number;
}

const VIDEO_TYPES: Record<string, VideoTypeInfo> = {
  reel: { label: 'Reel', icon: Film, color: 'text-rose-600', desc: 'Instagram & Facebook reels', aspect: '9:16', defaultDuration: 15 },
  story: { label: 'Story', icon: Square, color: 'text-pink-500', desc: 'Vertical stories', aspect: '9:16', defaultDuration: 15 },
  thumbnail: { label: 'Short', icon: Watch, color: 'text-teal-600', desc: 'YouTube Shorts', aspect: '9:16', defaultDuration: 30 },
  product_mockup: { label: 'Product Promo', icon: Package, color: 'text-emerald-600', desc: 'Product showcase video', aspect: '16:9', defaultDuration: 30 },
  campaign_asset: { label: 'Animated Slide', icon: MonitorPlay, color: 'text-blue-600', desc: 'Slideshow with text & music', aspect: '16:9', defaultDuration: 60 },
  voiceover: { label: 'Voiceover', icon: Mic2, color: 'text-purple-600', desc: 'AI voiceover narration', aspect: '16:9', defaultDuration: 45 },
};

const VIDEO_CATEGORIES = Object.keys(VIDEO_TYPES) as (keyof typeof VIDEO_TYPES)[];

const STYLE_OPTIONS = [
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'playful', label: 'Playful' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'documentary', label: 'Documentary' },
];

const VOICE_OPTIONS = [
  { value: 'none', label: 'No voiceover' },
  { value: 'male_us', label: 'Male · US English' },
  { value: 'female_us', label: 'Female · US English' },
  { value: 'male_uk', label: 'Male · British English' },
  { value: 'female_uk', label: 'Female · British English' },
  { value: 'male_ar', label: 'Male · Arabic' },
  { value: 'female_ar', label: 'Female · Arabic' },
  { value: 'male_es', label: 'Male · Spanish' },
  { value: 'female_es', label: 'Female · Spanish' },
];

const MUSIC_OPTIONS = [
  { value: 'none', label: 'No music' },
  { value: 'upbeat', label: 'Upbeat Pop' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'inspirational', label: 'Inspirational' },
  { value: 'chill', label: 'Chill Lo-fi' },
  { value: 'energetic', label: 'Energetic EDM' },
  { value: 'luxury', label: 'Luxury Ambient' },
  { value: 'dramatic', label: 'Dramatic Cinematic' },
];

const PLATFORM_OPTIONS = ['Instagram', 'Facebook', 'YouTube', 'TikTok', 'LinkedIn', 'Website'];

const FILTER_GROUPS: { label: string; types: string[] }[] = [
  { label: 'Vertical', types: ['reel', 'story', 'thumbnail'] },
  { label: 'Horizontal', types: ['product_mockup', 'campaign_asset', 'voiceover'] },
];

export default function VideoStudioPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Video Studio</h1>
        <p className="text-sm text-muted-foreground">
          Generate reels, shorts, product promos, and animated slides with AI voiceover, music, and captions.
        </p>
      </motion.div>

      <Tabs defaultValue="generate">
        <TabsList>
          <TabsTrigger value="generate" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="gallery" className="gap-1.5">
            <Film className="h-3.5 w-3.5" />
            Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-4">
          <GeneratePanel />
        </TabsContent>
        <TabsContent value="gallery" className="mt-4">
          <GalleryPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GeneratePanel() {
  const { toast } = useToast();
  const { data: products } = useProducts();
  const { data: credits } = useCredits();
  const generateVideo = useGenerateVideo();

  const [videoType, setVideoType] = useState<string>('reel');
  const [prompt, setPrompt] = useState('');
  const [productId, setProductId] = useState<string>('none');
  const [platform, setPlatform] = useState<string>('none');
  const [style, setStyle] = useState<string>('cinematic');
  const [voiceover, setVoiceover] = useState<string>('none');
  const [music, setMusic] = useState<string>('upbeat');
  const [captions, setCaptions] = useState(true);
  const [duration, setDuration] = useState<number>(15);
  const [result, setResult] = useState<MediaAsset | null>(null);

  const info = VIDEO_TYPES[videoType];
  const videoCredits = credits?.ai_video_credits ?? 0;
  const isOutOfCredits = credits !== undefined && credits !== null && videoCredits <= 0;

  const handleTypeChange = (type: string) => {
    setVideoType(type);
    setDuration(VIDEO_TYPES[type].defaultDuration);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: 'Please enter a prompt', variant: 'destructive' });
      return;
    }

    if (isOutOfCredits) {
      toast({
        title: 'No Video Credits',
        description: 'Free tier does not include video generation. Please upgrade to Starter or Growth in Billing to generate AI videos.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const generated = await generateVideo.mutateAsync({
        prompt: prompt.trim(),
        category: videoType as MediaCategory,
        productId: productId !== 'none' ? productId : undefined,
        platform: platform !== 'none' ? platform : undefined,
        durationSec: duration,
        style,
        voiceover: voiceover !== 'none' ? voiceover : undefined,
        music: music !== 'none' ? music : undefined,
        captions,
      });
      setResult(generated);
      toast({ title: 'Video generated successfully!' });
    } catch (err: any) {
      toast({
        title: 'Generation failed',
        description: err?.message || 'Failed to generate video',
        variant: 'destructive',
      });
    }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      {/* Left: Configuration */}
      <div className="space-y-4">
        {/* Credit status banner */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10">
              <Zap className="h-4 w-4 text-accent" />
            </div>
            <div>
              <span className="font-semibold text-foreground">{videoCredits}</span>
              <span className="text-muted-foreground"> Video credits available</span>
            </div>
          </div>
          <Link href="/dashboard/billing" className="font-medium text-accent hover:underline">
            Upgrade Plan →
          </Link>
        </div>

        {/* Video type selector */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Video Type</Label>
          <div className="grid grid-cols-3 gap-2">
            {VIDEO_CATEGORIES.map((type) => {
              const typeInfo = VIDEO_TYPES[type];
              const Icon = typeInfo.icon;
              return (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-2.5 transition-all ${
                    videoType === type
                      ? 'border-accent bg-accent/10'
                      : 'border-border hover:border-border/80 hover:bg-muted/30'
                  }`}
                  title={typeInfo.label}
                >
                  <Icon className={`h-4 w-4 ${videoType === type ? typeInfo.color : 'text-muted-foreground'}`} />
                  <span className={`text-[10px] leading-tight ${videoType === type ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                    {typeInfo.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prompt input */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="video-prompt">Describe your video</Label>
            <Textarea
              id="video-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Describe the complete ${info.label.toLowerCase()} ad: hook, product benefit, offer, proof, and final CTA...`}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Duration slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Duration</Label>
              <span className="text-xs font-medium text-foreground">{formatDuration(duration)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="range"
                min={5}
                max={120}
                step={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="flex-1 accent-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Style</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STYLE_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Auto</SelectItem>
                  {PLATFORM_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5"><Mic2 className="h-3 w-3" /> Voiceover</Label>
              <Select value={voiceover} onValueChange={setVoiceover}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOICE_OPTIONS.map((v) => (
                    <SelectItem key={v.value} value={v.value} className="text-xs">
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5"><Music className="h-3 w-3" /> Music</Label>
              <Select value={music} onValueChange={setMusic}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MUSIC_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value} className="text-xs">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-2.5">
            <div className="flex items-center gap-2">
              <Type className="h-3.5 w-3.5 text-muted-foreground" />
              <Label className="text-xs">Auto captions</Label>
            </div>
            <Switch checked={captions} onCheckedChange={setCaptions} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Link to product (optional)</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No product</SelectItem>
                {(products ?? []).map((p: { id: string; name: string }) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generateVideo.isPending || isOutOfCredits}
            className="w-full gap-2 bg-accent text-white hover:bg-accent/90 disabled:opacity-50"
          >
            {generateVideo.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Video...
              </>
            ) : isOutOfCredits ? (
              <>
                <Zap className="h-4 w-4" />
                Out of Video Credits (Upgrade to Generate)
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Generate Video (1 Credit)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Right: Result preview */}
      <div className="rounded-xl border border-border bg-card p-5 min-h-[400px] flex flex-col">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <info.icon className={`h-4 w-4 ${info.color}`} />
            <span className="text-sm font-semibold text-foreground">{info.label}</span>
          </div>
          {result && (
            <Badge variant="outline" className="text-[10px]">
              {result.model} · {info.aspect}
            </Badge>
          )}
        </div>

        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-1 flex-col"
            >
              <div className="relative flex-1 overflow-hidden rounded-lg border border-border bg-black flex items-center justify-center min-h-[280px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.thumbnail_url ?? result.url}
                  alt={result.ai_prompt ?? 'Generated video'}
                  className="h-full w-full object-cover opacity-80"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                    <Play className="h-6 w-6 text-white fill-white" />
                  </div>
                </div>
                {/* Duration badge */}
                <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5">
                  <span className="text-[10px] font-medium text-white">{formatDuration(duration)}</span>
                </div>
                {/* Captions indicator */}
                {captions && (
                  <div className="absolute bottom-2 left-2">
                    <Badge className="bg-black/70 text-white text-[9px]">
                      <Captions className="mr-1 h-2.5 w-2.5" />
                      CC
                    </Badge>
                  </div>
                )}
              </div>

              {/* Metadata chips */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {result.metadata.voiceover ? (
                  <Badge variant="outline" className="text-[10px]">
                    <Mic2 className="mr-1 h-2.5 w-2.5" />
                    {String(result.metadata.voiceover)}
                  </Badge>
                ) : null}
                {result.metadata.music ? (
                  <Badge variant="outline" className="text-[10px]">
                    <Music className="mr-1 h-2.5 w-2.5" />
                    {String(result.metadata.music)}
                  </Badge>
                ) : null}
                <Badge variant="outline" className="text-[10px]">
                  {String(result.metadata.style)}
                </Badge>
                {result.platform && (
                  <Badge variant="outline" className="text-[10px]">{result.platform}</Badge>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(result.url, '_blank')}
                  className="gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(result.url);
                    toast({ title: 'URL copied!' });
                  }}
                  className="gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy URL
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 flex-col items-center justify-center text-center"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
                <Film className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Create engaging videos</h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Pick a video type, describe your scene, choose voiceover and music — AI will generate a professional video.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function GalleryPanel() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null);
  const { data: assets, isLoading } = useVideoAssets({ search: search || undefined });
  const deleteAsset = useDeleteMediaAsset();
  const uploadMedia = useUploadMediaAsset();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadMedia.mutateAsync({
        file,
        category: 'user_upload',
      });
      toast({ title: 'Video uploaded to cloud storage!' });
    } catch (err: any) {
      toast({
        title: 'Upload failed',
        description: err?.message || 'Failed to upload video',
        variant: 'destructive',
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filtered = (assets ?? []).filter((asset: MediaAsset) => {
    if (filterGroup === 'all') return true;
    const group = FILTER_GROUPS.find((g) => g.label === filterGroup);
    return group?.types.includes(asset.category) ?? false;
  });

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAsset.mutateAsync(deleteTarget.id);
      toast({ title: 'Video deleted' });
      setDeleteTarget(null);
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-video rounded-xl border border-border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  if (!assets || assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="video/mp4,video/quicktime,video/webm"
          onChange={handleFileUpload}
        />
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
          <Film className="h-7 w-7 text-accent" />
        </div>
        <h3 className="text-base font-semibold text-foreground">No videos yet</h3>
        <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
          Generated videos and uploads will appear here.
        </p>
        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={uploadMedia.isPending}
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5"
          >
            {uploadMedia.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload Custom Video
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="video/mp4,video/quicktime,video/webm"
        onChange={handleFileUpload}
      />

      {/* Filters & Upload toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by prompt..."
            className="h-9 pl-9"
          />
        </div>
        <Select value={filterGroup} onValueChange={setFilterGroup}>
          <SelectTrigger className="h-9 w-[140px]">
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {FILTER_GROUPS.map((g) => (
              <SelectItem key={g.label} value={g.label}>{g.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          variant="outline"
          disabled={uploadMedia.isPending}
          onClick={() => fileInputRef.current?.click()}
          className="h-9 gap-1.5"
        >
          {uploadMedia.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          Upload Video
        </Button>
      </div>

      {/* Video grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((asset: MediaAsset, idx: number) => {
          const info = VIDEO_TYPES[asset.category] ?? VIDEO_TYPES.reel;
          const Icon = info.icon;
          const durationSec = (asset.metadata.duration_sec as number) ?? 15;
          return (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card"
              onClick={() => setPreviewAsset(asset)}
            >
              <div className="relative aspect-video overflow-hidden bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.thumbnail_url ?? asset.url}
                  alt={asset.ai_prompt ?? 'Video'}
                  className="h-full w-full object-cover opacity-80 transition-transform duration-300 group-hover:scale-105"
                />
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                    <Play className="h-4 w-4 text-white fill-white" />
                  </div>
                </div>
                {/* Duration badge */}
                <div className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5">
                  <span className="text-[10px] font-medium text-white">{formatDuration(durationSec)}</span>
                </div>
              </div>

              {/* Info bar */}
              <div className="p-2">
                <div className="flex items-center gap-1.5">
                  <Icon className={`h-3 w-3 ${info.color}`} />
                  <span className="text-[10px] font-medium text-foreground">{info.label}</span>
                  {asset.metadata.captions ? (
                    <Captions className="ml-auto h-3 w-3 text-muted-foreground" />
                  ) : null}
                </div>
                <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
                  {asset.ai_prompt ?? 'No prompt'}
                </p>
              </div>

              {asset.ai_generated && (
                <div className="absolute right-1.5 top-1.5">
                  <Badge className="bg-accent/90 text-white text-[9px]">
                    <Sparkles className="mr-1 h-2.5 w-2.5" />
                    AI
                  </Badge>
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(asset);
                }}
                className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="h-3 w-3 text-white hover:text-red-400" />
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Preview dialog */}
      <Dialog open={!!previewAsset} onOpenChange={(open) => !open && setPreviewAsset(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              {(() => {
                const info = previewAsset ? VIDEO_TYPES[previewAsset.category] : null;
                const Icon = info?.icon ?? Film;
                return (
                  <>
                    <Icon className={`h-4 w-4 ${info?.color ?? ''}`} />
                    {info?.label ?? 'Video'}
                  </>
                );
              })()}
            </DialogTitle>
          </DialogHeader>
          {previewAsset && (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-lg border border-border bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewAsset.url} alt={previewAsset.ai_prompt ?? 'Video'} className="w-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                    <Play className="h-7 w-7 text-white fill-white" />
                  </div>
                </div>
              </div>
              {previewAsset.ai_prompt && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Prompt</Label>
                  <p className="text-xs text-foreground">{previewAsset.ai_prompt}</p>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-[10px] capitalize">
                  {previewAsset.category.replace(/_/g, ' ')}
                </Badge>
                {previewAsset.platform && (
                  <Badge variant="outline" className="text-[10px]">{previewAsset.platform}</Badge>
                )}
                <Badge variant="outline" className="text-[10px]">
                  <Clock className="mr-1 h-2.5 w-2.5" />
                  {formatDuration((previewAsset.metadata.duration_sec as number) ?? 0)}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  <Ratio className="mr-1 h-2.5 w-2.5" />
                  {previewAsset.dimensions?.width}×{previewAsset.dimensions?.height}
                </Badge>
                {previewAsset.metadata.voiceover ? (
                  <Badge variant="outline" className="text-[10px]">
                    <Mic2 className="mr-1 h-2.5 w-2.5" />
                    {String(previewAsset.metadata.voiceover)}
                  </Badge>
                ) : null}
                {previewAsset.metadata.music ? (
                  <Badge variant="outline" className="text-[10px]">
                    <Music className="mr-1 h-2.5 w-2.5" />
                    {String(previewAsset.metadata.music)}
                  </Badge>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(previewAsset.url, '_blank')}
                  className="ml-auto gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this video?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The video will be permanently removed from your library.
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
    </div>
  );
}
