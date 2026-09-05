'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Loader2,
  Save,
  Package,
  Tag,
  ImagePlus,
  X,
  Plus,
  Bot,
  Sparkles,
  TrendingUp,
  Target,
  Users,
  Lightbulb,
} from 'lucide-react';
import { useProduct, useUpdateProduct } from '@/hooks/use-products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { ProductStatus, InventoryStatus } from '@/types/database';

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { data: product, isLoading } = useProduct(params.id);
  const updateProduct = useUpdateProduct(params.id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [sku, setSku] = useState('');
  const [status, setStatus] = useState<ProductStatus>('draft');
  const [inventoryCount, setInventoryCount] = useState('');
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus>('in_stock');
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description ?? '');
      setCategory(product.category ?? '');
      setPrice(product.price != null ? String(product.price) : '');
      setCompareAtPrice(product.compare_at_price != null ? String(product.compare_at_price) : '');
      setSku(product.sku ?? '');
      setStatus(product.status);
      setInventoryCount(String(product.inventory_count));
      setInventoryStatus(product.inventory_status);
      setImages(product.images ?? []);
      setTags(product.tags ?? []);
    }
  }, [product]);

  const addImage = () => {
    const url = imageUrl.trim();
    if (url && !images.includes(url)) {
      setImages([...images, url]);
      setImageUrl('');
    }
  };

  const removeImage = (url: string) => {
    setImages(images.filter((u) => u !== url));
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!product) return;

    try {
      await updateProduct.mutateAsync({
        name,
        description: description || null,
        category: category || null,
        price: price ? parseFloat(price) : null,
        compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
        sku: sku || null,
        status,
        images,
        tags,
        inventory_count: inventoryCount ? parseInt(inventoryCount, 10) : 0,
        inventory_status: inventoryStatus,
      });
      toast({ title: 'Product updated' });
    } catch {
      toast({ title: 'Failed to update product', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Package className="mb-3 h-10 w-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Product not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This product may have been deleted.
        </p>
        <Link href="/dashboard/products">
          <Button variant="ghost" className="mt-4">Back to products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link
          href="/dashboard/products"
          className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to products
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{product.name}</h1>
        <p className="text-sm text-muted-foreground">
          Edit product details, manage variants, and view AI analysis.
        </p>
      </motion.div>

      <Tabs defaultValue="edit">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="edit">Edit Details</TabsTrigger>
          <TabsTrigger value="ai">AI Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-4">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Basic Information</h2>

              <div className="space-y-1.5">
                <Label htmlFor="name">Product name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Product status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as ProductStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Pricing & Inventory</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="price">Price (USD)</Label>
                  <Input id="price" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="compareAtPrice">Compare-at price</Label>
                  <Input id="compareAtPrice" type="number" step="0.01" min="0" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="inventoryCount">Inventory count</Label>
                  <Input id="inventoryCount" type="number" min="0" value={inventoryCount} onChange={(e) => setInventoryCount(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Inventory status</Label>
                <Select value={inventoryStatus} onValueChange={(v) => setInventoryStatus(v as InventoryStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Images</h2>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ImagePlus className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                    placeholder="https://example.com/product-image.jpg"
                    className="pl-9"
                  />
                </div>
                <Button type="button" variant="secondary" onClick={addImage} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {images.map((url) => (
                    <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Product" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-md bg-background/80 opacity-0 backdrop-blur transition-all group-hover:opacity-100 hover:bg-destructive hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Tags</h2>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add a tag..."
                    className="pl-9"
                  />
                </div>
                <Button type="button" variant="secondary" onClick={addTag} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground"
                    >
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)}>
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                type="submit"
                disabled={updateProduct.isPending}
                className="gap-2 bg-accent text-white hover:bg-accent/90"
              >
                {updateProduct.isPending ? (
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
          </form>
        </TabsContent>

        <TabsContent value="ai" className="mt-4">
          <AIAnalysisTab product={product} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AIAnalysisTab({ product }: { product: { ai_analysis: Record<string, unknown> | null; ai_analysis_completed_at: string | null; name: string } }) {
  if (!product.ai_analysis) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-chart-2">
          <Bot className="h-7 w-7 text-white" />
        </div>
        <h3 className="text-base font-semibold text-foreground">AI Analysis Not Run Yet</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          Run AI analysis on this product to automatically detect target audience, keywords, competitors, USPs, and content opportunities.
        </p>
        <Button className="mt-4 gap-2 bg-accent text-white hover:bg-accent/90" disabled>
          <Sparkles className="h-4 w-4" />
          Run AI Analysis
          <span className="ml-1 rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-bold uppercase">
            Soon
          </span>
        </Button>
      </div>
    );
  }

  const analysis = product.ai_analysis;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-gradient-to-br from-accent/5 to-chart-2/5 p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">AI Analysis Complete</h3>
          <Badge variant="secondary" className="text-[10px]">
            {product.ai_analysis_completed_at
              ? new Date(product.ai_analysis_completed_at).toLocaleDateString()
              : 'N/A'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AnalysisCard icon={Target} title="Target Audience" items={analysis.audience as string[]} />
        <AnalysisCard icon={TrendingUp} title="Keywords" items={analysis.keywords as string[]} />
        <AnalysisCard icon={Users} title="Competitors" items={analysis.competitors as string[]} />
        <AnalysisCard icon={Lightbulb} title="USPs" items={analysis.usps as string[]} />
      </div>
    </div>
  );
}

function AnalysisCard({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof Target;
  title: string;
  items?: string[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
          <Icon className="h-4 w-4 text-accent" />
        </div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      {items && items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <Badge key={item} variant="secondary" className="text-[11px]">
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No data available</p>
      )}
    </div>
  );
}
