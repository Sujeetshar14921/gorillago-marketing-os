'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { MediaAsset } from '@/types/database';
import { CATEGORIES } from './image-studio-constants';
import { Image as ImageIcon } from 'lucide-react';

export interface ImagePreviewDialogProps {
  asset: MediaAsset | null;
  onClose: () => void;
}

export function ImagePreviewDialog({ asset, onClose }: ImagePreviewDialogProps) {
  if (!asset) return null;

  const info = CATEGORIES[asset.category];
  const Icon = info?.icon ?? ImageIcon;

  return (
    <Dialog open={Boolean(asset)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Icon className={`h-4 w-4 ${info?.color ?? ''}`} />
            {info?.label ?? 'Image'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="overflow-hidden rounded-lg border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset.url} alt={asset.ai_prompt ?? 'Image'} className="w-full" />
          </div>

          {asset.ai_prompt && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Prompt</Label>
              <p className="text-xs text-foreground">{asset.ai_prompt}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[10px] capitalize">
              {asset.category.replace(/_/g, ' ')}
            </Badge>
            {asset.platform && (
              <Badge variant="outline" className="text-[10px]">{asset.platform}</Badge>
            )}
            <Badge variant="outline" className="text-[10px]">
              {asset.dimensions?.width}×{asset.dimensions?.height}
            </Badge>
            {asset.model && (
              <Badge variant="outline" className="text-[10px]">{asset.model}</Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(asset.url, '_blank')}
              className="ml-auto gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
