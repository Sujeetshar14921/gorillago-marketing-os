'use client';

import { useState } from 'react';
import { PenLine, Copy, Check, ThumbsUp } from 'lucide-react';
import { useUpdateContent } from '@/hooks/use-content';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { ContentGeneration } from '@/types/database';

export interface GeneratedContentCardProps {
  content: ContentGeneration;
}

export function GeneratedContentCard({ content }: GeneratedContentCardProps) {
  const { toast } = useToast();
  const updateContent = useUpdateContent();
  const [copied, setCopied] = useState(false);
  const [approved, setApproved] = useState(content.is_approved);
  const [editedContent, setEditedContent] = useState(content.content ?? '');
  const [isEditing, setIsEditing] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(editedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = async () => {
    try {
      await updateContent.mutateAsync({ id: content.id, isApproved: !approved });
      setApproved(!approved);
      toast({ title: approved ? 'Unapproved' : 'Content approved!' });
    } catch {
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updateContent.mutateAsync({ id: content.id, content: editedContent });
      setIsEditing(false);
      toast({ title: 'Content updated' });
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-3">
      {isEditing ? (
        <Textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="flex-1 resize-none text-sm leading-relaxed"
        />
      ) : (
        <div className="flex-1 overflow-auto rounded-lg border border-border bg-muted/20 p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{editedContent}</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <Button size="sm" onClick={handleSaveEdit} disabled={updateContent.isPending} className="gap-1.5 bg-accent text-white hover:bg-accent/90">
              <Check className="h-3.5 w-3.5" />
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditedContent(content.content ?? ''); }}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="gap-1.5">
              <PenLine className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleApprove}
              disabled={updateContent.isPending}
              className={`gap-1.5 ${approved ? 'border-success/30 bg-success/10 text-success' : ''}`}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              {approved ? 'Approved' : 'Approve'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
