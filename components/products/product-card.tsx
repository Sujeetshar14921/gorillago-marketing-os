'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, MoreVertical, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Product } from '@/types/database';

interface ProductCardProps {
  product: Product;
  index?: number;
  onDelete?: (id: string) => void;
}

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/20',
  draft: 'bg-muted text-muted-foreground border-border',
  archived: 'bg-warning/10 text-warning border-warning/20',
};

const inventoryColors: Record<string, string> = {
  in_stock: 'text-success',
  low_stock: 'text-warning',
  out_of_stock: 'text-destructive',
};

export function ProductCard({ product, index = 0, onDelete }: ProductCardProps) {
  const primaryImage = product.images?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg hover:shadow-black/5 hover:border-accent/20"
    >
      <Link href={`/dashboard/products/${product.id}`}>
        <div className="relative aspect-square w-full overflow-hidden bg-muted/30">
          {primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryImage}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute left-3 top-3">
            <span
              className={cn(
                'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                statusColors[product.status] ?? statusColors.draft
              )}
            >
              {product.status}
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-foreground">
                {product.name}
              </h3>
              {product.category && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {product.category}
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              {product.price != null && (
                <span className="text-base font-bold text-foreground">
                  ${Number(product.price).toFixed(2)}
                </span>
              )}
              {product.compare_at_price != null && (
                <span className="text-xs text-muted-foreground line-through">
                  ${Number(product.compare_at_price).toFixed(2)}
                </span>
              )}
            </div>
            <span
              className={cn(
                'text-[10px] font-medium capitalize',
                inventoryColors[product.inventory_status] ?? 'text-muted-foreground'
              )}
            >
              {product.inventory_status.replace('_', ' ')}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="rounded bg-muted px-1.5 py-0.5 font-medium uppercase">
              {product.source}
            </span>
            {product.images.length > 0 && (
              <span className="flex items-center gap-0.5">
                <ImageIcon className="h-3 w-3" />
                {product.images.length}
              </span>
            )}
            {product.sku && (
              <span className="truncate">SKU: {product.sku}</span>
            )}
          </div>
        </div>
      </Link>

      <div className="absolute right-2 top-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-background/80 opacity-0 backdrop-blur transition-all group-hover:opacity-100 hover:bg-muted">
              <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/products/${product.id}`}>Edit</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/products/${product.id}?tab=ai`}>AI Analysis</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete?.(product.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
