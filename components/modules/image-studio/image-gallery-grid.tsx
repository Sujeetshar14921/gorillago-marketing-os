'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Image as ImageIcon,
  Sparkles,
  Loader2,
  Trash2,
  Search,
  Upload,
  Filter,
} from 'lucide-react';
import { useMediaAssets, useDeleteMediaAsset, useUploadMediaAsset } from '@/hooks/use-media-assets';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import type { MediaAsset } from '@/types/database';
import { CATEGORIES, FILTER_GROUPS } from './image-studio-constants';
import { ImagePreviewDialog } from './image-preview-dialog';

export function ImageGalleryGrid() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null);

  const { data: assets, isLoading } = useMediaAssets({ search: search || undefined });
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
      toast({ title: 'Image uploaded to cloud storage!' });
    } catch (err: any) {
      toast({
        title: 'Upload failed',
        description: err?.message || 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filtered = (assets ?? []).filter((asset: MediaAsset) => {
    if (filterGroup === 'all') return true;
    const group = FILTER_GROUPS.find((g) => g.label === filterGroup);
    return group?.categories.includes(asset.category) ?? false;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAsset.mutateAsync(deleteTarget.id);
      toast({ title: 'Image deleted' });
      setDeleteTarget(null);
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl border border-border bg-card animate-pulse" />
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
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileUpload}
        />
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
          <ImageIcon className="h-7 w-7 text-accent" />
        </div>
        <h3 className="text-base font-semibold text-foreground">No images yet</h3>
        <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
          Generated images and uploads will appear here.
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
            Upload Custom Image
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/webp,image/gif"
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
          Upload
        </Button>
      </div>

      {/* Gallery grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((asset: MediaAsset, idx: number) => {
          const info = CATEGORIES[asset.category];
          const Icon = info?.icon ?? ImageIcon;
          return (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card"
              onClick={() => setPreviewAsset(asset)}
            >
              <div className="aspect-square overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.thumbnail_url ?? asset.url}
                  alt={asset.ai_prompt ?? 'Image'}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3 w-3 text-white" />
                    <span className="text-[10px] font-medium text-white">{info?.label}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[10px] text-white/70">
                    {asset.ai_prompt ?? 'No prompt'}
                  </p>
                </div>
              </div>
              {asset.ai_generated && (
                <div className="absolute right-2 top-2">
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
                className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-md bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="h-3 w-3 text-white hover:text-red-400" />
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Preview Dialog */}
      <ImagePreviewDialog asset={previewAsset} onClose={() => setPreviewAsset(null)} />

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this image?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The image will be permanently removed from your gallery.
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
