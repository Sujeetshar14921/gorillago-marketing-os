'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Search, Package, SlidersHorizontal, Trash2, AlertCircle } from 'lucide-react';
import { useProducts, useDeleteProduct } from '@/hooks/use-products';
import { ProductCard } from '@/components/products/product-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useToast } from '@/hooks/use-toast';
import type { Product, ProductStatus, ProductSource } from '@/types/database';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<ProductSource | 'all'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { toast } = useToast();
  const { data: products, isLoading } = useProducts({
    search: search || undefined,
    status: statusFilter,
    source: sourceFilter,
  });
  const deleteProduct = useDeleteProduct();

  const productCount = products?.length ?? 0;

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProduct.mutateAsync(deleteId);
      toast({ title: 'Product deleted' });
    } catch {
      toast({ title: 'Failed to delete product', variant: 'destructive' });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-1"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Products</h1>
            <p className="text-sm text-muted-foreground">
              {productCount > 0
                ? `${productCount} product${productCount !== 1 ? 's' : ''} in your catalog`
                : 'Manage your product catalog'}
            </p>
          </div>
          <Link href="/dashboard/products/new">
            <Button className="gap-2 bg-accent text-white hover:bg-accent/90">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>
      </motion.div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, category, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ProductStatus | 'all')}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as ProductSource | 'all')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="csv">CSV Import</SelectItem>
              <SelectItem value="shopify">Shopify</SelectItem>
              <SelectItem value="url">URL</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-shimmer rounded-xl border border-border bg-card p-4">
              <div className="aspect-square rounded-lg bg-muted" />
              <div className="mt-3 h-4 w-3/4 rounded bg-muted" />
              <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : productCount === 0 ? (
        <EmptyState hasFilters={!!(search || statusFilter !== 'all' || sourceFilter !== 'all')} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products!.map((product: Product, idx: number) => (
            <ProductCard
              key={product.id}
              product={product}
              index={idx}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product and all its variants and reviews. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
        <AlertCircle className="mb-3 h-8 w-8 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">No products found</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
        <Package className="h-7 w-7 text-accent" />
      </div>
      <h3 className="text-base font-semibold text-foreground">No products yet</h3>
      <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
        Add your first product to start generating AI content, campaigns, and ads.
      </p>
      <Link href="/dashboard/products/new">
        <Button className="mt-4 gap-2 bg-accent text-white hover:bg-accent/90">
          <Plus className="h-4 w-4" />
          Add Your First Product
        </Button>
      </Link>
    </div>
  );
}
