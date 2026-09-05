'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Loader2,
  Download,
  Wand2,
  Check,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useCredits } from '@/hooks/use-billing';
import { useGenerateImage } from '@/hooks/use-media-assets';
import { useProducts } from '@/hooks/use-products';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MediaCategory, MediaAsset } from '@/types/database';
import { CATEGORIES, PLATFORM_OPTIONS } from './image-studio-constants';

export function ImageGeneratorForm() {
  const { toast } = useToast();
  const { data: products } = useProducts();
  const { data: credits } = useCredits();
  const generateImage = useGenerateImage();

  const [category, setCategory] = useState<MediaCategory>('product_image');
  const [prompt, setPrompt] = useState('');
  const [productId, setProductId] = useState<string>('none');
  const [platform, setPlatform] = useState<string>('none');
  const [result, setResult] = useState<MediaAsset | null>(null);

  const info = CATEGORIES[category];
  const imageCredits = credits?.ai_image_credits ?? 0;
  const isOutOfCredits = credits !== undefined && credits !== null && imageCredits <= 0;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: 'Please enter a prompt', variant: 'destructive' });
      return;
    }

    if (isOutOfCredits) {
      toast({
        title: 'No Image Credits',
        description: 'You have 0 AI image credits remaining. Please upgrade your plan in Billing to continue.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const generated = await generateImage.mutateAsync({
        prompt: prompt.trim(),
        category,
        productId: productId !== 'none' ? productId : undefined,
        platform: platform !== 'none' ? platform : undefined,
      });
      setResult(generated);
      toast({ title: 'Image generated successfully!' });
    } catch (err: any) {
      toast({
        title: 'Generation failed',
        description: err?.message || 'Failed to generate image',
        variant: 'destructive',
      });
    }
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
              <span className="font-semibold text-foreground">{imageCredits}</span>
              <span className="text-muted-foreground"> Image credits available</span>
            </div>
          </div>
          <Link href="/dashboard/billing" className="font-medium text-accent hover:underline">
            Manage Plan →
          </Link>
        </div>

        {/* Category selector */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Image Type</Label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {(Object.keys(CATEGORIES) as MediaCategory[]).map((cat) => {
              const catInfo = CATEGORIES[cat];
              const Icon = catInfo.icon;
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-2.5 transition-all ${
                    category === cat
                      ? 'border-accent bg-accent/10'
                      : 'border-border hover:border-border/80 hover:bg-muted/30'
                  }`}
                  title={catInfo.label}
                >
                  <Icon className={`h-4 w-4 ${category === cat ? catInfo.color : 'text-muted-foreground'}`} />
                  <span className={`text-[10px] leading-tight ${category === cat ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                    {catInfo.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prompt + options */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="img-prompt">Describe your image</Label>
            <Textarea
              id="img-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Describe the complete ${info.label.toLowerCase()} ad: product benefit, offer, trust point, and CTA...`}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Platform (optional)</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Auto-size</SelectItem>
                  {PLATFORM_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Link to product</Label>
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
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generateImage.isPending || isOutOfCredits}
            className="w-full gap-2 bg-accent text-white hover:bg-accent/90 disabled:opacity-50"
          >
            {generateImage.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Image...
              </>
            ) : isOutOfCredits ? (
              <>
                <Zap className="h-4 w-4" />
                Out of Credits (Upgrade to Generate)
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Generate Image (1 Credit)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Right: Result */}
      <div className="rounded-xl border border-border bg-card p-5 min-h-[400px] flex flex-col">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <info.icon className={`h-4 w-4 ${info.color}`} />
            <span className="text-sm font-semibold text-foreground">{info.label}</span>
          </div>
          {result && (
            <Badge variant="outline" className="text-[10px]">
              {result.model} · {result.dimensions?.width}×{result.dimensions?.height}
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
              <div className="relative flex-1 overflow-hidden rounded-lg border border-border bg-muted/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.url}
                  alt={result.ai_prompt ?? 'Generated image'}
                  className="h-full w-full object-cover"
                />
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
                  <Check className="h-3.5 w-3.5" />
                  Copy URL
                </Button>
                <Badge variant="outline" className="ml-auto text-[10px] capitalize">
                  {result.category.replace(/_/g, ' ')}
                </Badge>
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
                <Wand2 className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Create stunning visuals</h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Pick an image type, describe what you want, and AI will generate a professional visual for you.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
