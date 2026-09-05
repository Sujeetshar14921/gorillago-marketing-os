'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Zap } from 'lucide-react';
import Link from 'next/link';
import { useCredits } from '@/hooks/use-billing';
import { useGenerateContent } from '@/hooks/use-content';
import { useProducts } from '@/hooks/use-products';
import { useBrand } from '@/hooks/use-brands';
import { useOrgSettings } from '@/hooks/use-settings';
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
import type { ContentType, ContentGeneration } from '@/types/database';
import { CONTENT_TYPES, TONE_OPTIONS } from './content-studio-constants';
import { GeneratedContentCard } from './generated-content-card';

export function ContentGeneratorForm() {
  const { toast } = useToast();
  const { data: products } = useProducts();
  const { data: brand } = useBrand();
  const { data: settings } = useOrgSettings();
  const { data: credits } = useCredits();
  const generateContent = useGenerateContent();

  const [selectedType, setSelectedType] = useState<ContentType>('instagram_caption');
  const [prompt, setPrompt] = useState('');
  const [productId, setProductId] = useState<string>('none');
  const [tone, setTone] = useState<string>(brand?.tone_of_voice ?? 'professional');
  const [language, setLanguage] = useState<string>(brand?.language ?? 'en');
  const [result, setResult] = useState<ContentGeneration | null>(null);

  const aiModel = settings?.ai_model ?? 'gpt-4o';
  const info = CONTENT_TYPES[selectedType];
  const contentCredits = credits?.ai_content_credits ?? 0;
  const isOutOfCredits = credits !== undefined && credits !== null && contentCredits <= 0;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: 'Please enter a prompt', variant: 'destructive' });
      return;
    }

    if (isOutOfCredits) {
      toast({
        title: 'No Content Credits',
        description: 'You have 0 AI content credits remaining. Please upgrade your plan in Billing to continue.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const generated = await generateContent.mutateAsync({
        type: selectedType,
        prompt: prompt.trim(),
        productId: productId !== 'none' ? productId : undefined,
        tone,
        language,
        model: aiModel,
      });
      setResult(generated);
      toast({ title: 'Content generated successfully!' });
    } catch (err: any) {
      toast({
        title: 'Generation failed',
        description: err?.message || 'Failed to generate content',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      {/* Left: Configuration */}
      <div className="space-y-4">
        {/* Credit status banner */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10">
              <Zap className="h-4 w-4 text-accent" />
            </div>
            <div>
              <span className="font-semibold text-foreground">{contentCredits}</span>
              <span className="text-muted-foreground"> Content credits available</span>
            </div>
          </div>
          <Link href="/dashboard/billing" className="font-medium text-accent hover:underline">
            Manage Plan →
          </Link>
        </div>

        {/* Content type selector */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Content Type</Label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {(Object.keys(CONTENT_TYPES) as ContentType[]).map((type) => {
              const typeInfo = CONTENT_TYPES[type];
              const Icon = typeInfo.icon;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-2.5 transition-all ${
                    selectedType === type
                      ? 'border-accent bg-accent/10'
                      : 'border-border hover:border-border/80 hover:bg-muted/30'
                  }`}
                  title={typeInfo.label}
                >
                  <Icon className={`h-4 w-4 ${selectedType === type ? typeInfo.color : 'text-muted-foreground'}`} />
                  <span className={`text-[10px] leading-tight ${selectedType === type ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
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
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`${info.placeholder} Include the customer benefit, offer, proof, and a clear CTA.`}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize text-xs">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            disabled={generateContent.isPending || isOutOfCredits}
            className="w-full gap-2 bg-accent text-white hover:bg-accent/90 disabled:opacity-50"
          >
            {generateContent.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Content...
              </>
            ) : isOutOfCredits ? (
              <>
                <Zap className="h-4 w-4" />
                Out of Credits (Upgrade to Generate)
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Content (1 Credit)
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
              {aiModel} · {result.tokens_used} tokens
            </Badge>
          )}
        </div>

        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-1 flex-col"
            >
              <GeneratedContentCard content={result} />
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
                <Sparkles className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Ready to create</h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Choose a content type, write your prompt, and let AI craft the perfect content for you.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
