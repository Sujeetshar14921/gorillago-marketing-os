'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PenLine, Search, Filter, Check, Trash2 } from 'lucide-react';
import { useContentGenerations, useDeleteContent } from '@/hooks/use-content';
import { useToast } from '@/hooks/use-toast';
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
import type { ContentGeneration } from '@/types/database';
import { CONTENT_TYPES, FILTER_CATEGORIES } from './content-studio-constants';

export function ContentHistoryPanel() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<ContentGeneration | null>(null);

  const { data: generations, isLoading } = useContentGenerations({
    search: search || undefined,
  });
  const deleteContent = useDeleteContent();

  const filtered = (generations ?? []).filter((gen: ContentGeneration) => {
    if (filterCategory === 'all') return true;
    const cat = FILTER_CATEGORIES.find((c) => c.label === filterCategory);
    return cat?.types.includes(gen.type) ?? false;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteContent.mutateAsync(deleteTarget.id);
      toast({ title: 'Content deleted' });
      setDeleteTarget(null);
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  if (!generations || generations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
          <PenLine className="h-7 w-7 text-accent" />
        </div>
        <h3 className="text-base font-semibold text-foreground">No content yet</h3>
        <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
          Generated content will appear here. Switch to the Generate tab to create your first piece.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search content..."
            className="h-9 pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-9 w-[150px]">
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {FILTER_CATEGORIES.map((cat) => (
              <SelectItem key={cat.label} value={cat.label}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((gen: ContentGeneration, idx: number) => {
          const info = CONTENT_TYPES[gen.type];
          const Icon = info?.icon ?? PenLine;
          return (
            <motion.div
              key={gen.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
              className="group rounded-xl border border-border bg-card p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${info?.color ?? 'text-muted-foreground'}`} />
                  <span className="text-xs font-semibold text-foreground">{info?.label ?? gen.type}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {gen.is_approved && (
                    <Badge variant="outline" className="border-success/30 bg-success/10 text-success text-[10px]">
                      <Check className="mr-1 h-2.5 w-2.5" />
                      Approved
                    </Badge>
                  )}
                  <button
                    onClick={() => setDeleteTarget(gen)}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </div>
              <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                {gen.content ?? 'No content'}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70">
                <span className="capitalize">{gen.tone}</span>
                <span>·</span>
                <span className="uppercase">{gen.language}</span>
                <span>·</span>
                <span>{new Date(gen.created_at).toLocaleDateString()}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this content?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The generated content will be permanently removed.
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
