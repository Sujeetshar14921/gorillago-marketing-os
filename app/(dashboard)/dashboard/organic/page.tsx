'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Calendar,
  Plus,
  Send,
  Clock,
  CheckCircle2,
  FileEdit,
  Trash2,
  Search,
  Filter,
  Loader2,
  CalendarDays,
  ListChecks,
  Image as ImageIcon,
  Hash,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Twitter,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  ExternalLink,
} from 'lucide-react';
import { useCampaigns, useCreateCampaign } from '@/hooks/use-campaigns';
import {
  useCampaignPosts,
  useCreatePost,
  useUpdatePost,
  useDeletePost,
  usePublishPostNow,
  useTriggerScheduledWorker,
} from '@/hooks/use-posts';
import { useSocialAccounts } from '@/hooks/use-social-accounts';
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
  DialogFooter,
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
import type { CampaignPost, PostStatus, SocialPlatform, Campaign, SocialAccount } from '@/types/database';

const PLATFORM_META: Record<SocialPlatform, { label: string; icon: typeof Facebook; color: string }> = {
  facebook: { label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  instagram: { label: 'Instagram', icon: Instagram, color: 'text-rose-500' },
  linkedin: { label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
  pinterest: { label: 'Pinterest', icon: ImageIcon, color: 'text-red-600' },
  youtube: { label: 'YouTube', icon: Youtube, color: 'text-red-500' },
  x: { label: 'X', icon: Twitter, color: 'text-foreground' },
  telegram: { label: 'Telegram', icon: MessageCircle, color: 'text-sky-500' },
  threads: { label: 'Threads', icon: MessageCircle, color: 'text-foreground' },
};

const STATUS_META: Record<PostStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: 'text-muted-foreground', bg: 'bg-muted' },
  pending_approval: { label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-500/10' },
  approved: { label: 'Approved', color: 'text-blue-600', bg: 'bg-blue-500/10' },
  scheduled: { label: 'Scheduled', color: 'text-purple-600', bg: 'bg-purple-500/10' },
  publishing: { label: 'Publishing', color: 'text-orange-600', bg: 'bg-orange-500/10' },
  published: { label: 'Published', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  failed: { label: 'Failed', color: 'text-destructive', bg: 'bg-destructive/10' },
  recurring: { label: 'Recurring', color: 'text-teal-600', bg: 'bg-teal-500/10' },
};

const PLATFORMS = Object.keys(PLATFORM_META) as SocialPlatform[];
const STATUS_FILTERS: (PostStatus | 'all')[] = ['all', 'draft', 'pending_approval', 'approved', 'scheduled', 'published', 'failed'];

export default function OrganicPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Organic Publishing</h1>
        <p className="text-sm text-muted-foreground">
          Compose, schedule, and publish organic posts across all your connected social platforms.
        </p>
      </motion.div>

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue" className="gap-1.5">
            <ListChecks className="h-3.5 w-3.5" />
            Post Queue
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-4">
          <QueueTab />
        </TabsContent>
        <TabsContent value="calendar" className="mt-4">
          <CalendarTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// QUEUE TAB
// ============================================================

function QueueTab() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [showComposer, setShowComposer] = useState(false);
  const [editPost, setEditPost] = useState<CampaignPost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CampaignPost | null>(null);
  const [approveTarget, setApproveTarget] = useState<CampaignPost | null>(null);

  const { data: posts, isLoading } = useCampaignPosts({
    search: search || undefined,
    status: statusFilter as PostStatus | 'all',
    platform: platformFilter as SocialPlatform | 'all',
  });
  const deletePost = useDeletePost();
  const updatePost = useUpdatePost();
  const publishPostNow = usePublishPostNow();
  const triggerWorker = useTriggerScheduledWorker();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePost.mutateAsync(deleteTarget.id);
      toast({ title: 'Post deleted' });
      setDeleteTarget(null);
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleApprove = async () => {
    if (!approveTarget) return;
    try {
      await updatePost.mutateAsync({ id: approveTarget.id, status: 'approved' });
      toast({ title: 'Post approved' });
      setApproveTarget(null);
    } catch {
      toast({ title: 'Failed to approve', variant: 'destructive' });
    }
  };

  const handlePublish = async (post: CampaignPost) => {
    try {
      const result = await publishPostNow.mutateAsync(post.id);
      toast({
        title: 'Post published!',
        description: `Dispatched to ${PLATFORM_META[post.platform]?.label ?? post.platform}${
          result.external_post_id ? ` (ID: ${result.external_post_id.slice(0, 16)}...)` : ''
        }`,
      });
    } catch (err: any) {
      toast({
        title: 'Publish failed',
        description: err?.message || 'Failed to dispatch post to platform',
        variant: 'destructive',
      });
    }
  };

  const handleRunWorker = async () => {
    try {
      const result = await triggerWorker.mutateAsync();
      toast({
        title: 'Scheduler sync complete',
        description: result.message || `Processed ${result.processed} due posts`,
      });
    } catch (err: any) {
      toast({
        title: 'Scheduler error',
        description: err?.message || 'Failed to trigger background worker',
        variant: 'destructive',
      });
    }
  };

  const handleSchedule = async (post: CampaignPost) => {
    if (!post.scheduled_at) {
      toast({ title: 'Set a schedule time first', variant: 'destructive' });
      return;
    }
    try {
      await updatePost.mutateAsync({ id: post.id, status: 'scheduled' });
      toast({ title: 'Post scheduled!' });
    } catch {
      toast({ title: 'Schedule failed', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="h-9 pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[130px]">
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'all' ? 'All statuses' : STATUS_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All platforms</SelectItem>
            {PLATFORMS.map((p) => (
              <SelectItem key={p} value={p}>{PLATFORM_META[p].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          disabled={triggerWorker.isPending}
          onClick={handleRunWorker}
          className="h-9 gap-1.5"
          title="Check and publish due scheduled posts now"
        >
          {triggerWorker.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Clock className="h-3.5 w-3.5 text-purple-600" />
          )}
          Sync Due Posts
        </Button>
        <Button onClick={() => setShowComposer(true)} className="gap-1.5 bg-accent text-white hover:bg-accent/90">
          <Plus className="h-4 w-4" />
          New Post
        </Button>
      </div>

      {/* Post list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : !posts || posts.length === 0 ? (
        <EmptyState onCreate={() => setShowComposer(true)} />
      ) : (
        <div className="space-y-2.5">
          {(posts as CampaignPost[]).map((post, idx) => (
            <PostCard
              key={post.id}
              post={post}
              index={idx}
              onEdit={() => setEditPost(post)}
              onDelete={() => setDeleteTarget(post)}
              onApprove={() => setApproveTarget(post)}
              onPublish={() => handlePublish(post)}
              onSchedule={() => handleSchedule(post)}
            />
          ))}
        </div>
      )}

      {/* Composer dialog */}
      <PostComposer
        open={showComposer}
        onClose={() => setShowComposer(false)}
      />

      {/* Edit dialog */}
      <PostComposer
        open={!!editPost}
        post={editPost}
        onClose={() => setEditPost(null)}
      />

      {/* Delete dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the post. This action cannot be undone.
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

      {/* Approve dialog */}
      <AlertDialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this post?</AlertDialogTitle>
            <AlertDialogDescription>
              The post will be marked as approved and ready to schedule or publish.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
        <Send className="h-7 w-7 text-accent" />
      </div>
      <h3 className="text-base font-semibold text-foreground">No posts yet</h3>
      <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
        Create your first post and publish it across your social platforms.
      </p>
      <Button onClick={onCreate} className="mt-4 gap-1.5 bg-accent text-white hover:bg-accent/90">
        <Plus className="h-4 w-4" />
        Create Post
      </Button>
    </div>
  );
}

function PostCard({
  post,
  index,
  onEdit,
  onDelete,
  onApprove,
  onPublish,
  onSchedule,
}: {
  post: CampaignPost;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onApprove: () => void;
  onPublish: () => void;
  onSchedule: () => void;
}) {
  const platform = PLATFORM_META[post.platform] ?? PLATFORM_META.facebook;
  const status = STATUS_META[post.status] ?? STATUS_META.draft;
  const PlatformIcon = platform.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className="group rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        {/* Platform icon */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <PlatformIcon className={`h-4 w-4 ${platform.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-foreground">{platform.label}</span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${status.bg} ${status.color}`}>
              {post.status === 'publishing' ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  Publishing...
                </span>
              ) : (
                status.label
              )}
            </span>
            {post.scheduled_at && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                {formatDateTime(post.scheduled_at)}
              </span>
            )}
            {post.published_at && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                <CheckCircle2 className="h-2.5 w-2.5" />
                {formatDateTime(post.published_at)}
              </span>
            )}
            {post.external_post_id && (
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground" title={post.external_post_id}>
                ID: {post.external_post_id.length > 18 ? `${post.external_post_id.slice(0, 18)}...` : post.external_post_id}
              </span>
            )}
          </div>

          <p className="text-sm text-foreground line-clamp-2">
            {post.content ?? 'No content'}
          </p>

          {post.error_message && (
            <p className="rounded bg-destructive/10 px-2 py-1 text-[11px] text-destructive">
              Error: {post.error_message}
            </p>
          )}

          {post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.hashtags.slice(0, 5).map((tag, i) => (
                <span key={i} className="text-[10px] text-accent">#{tag}</span>
              ))}
              {post.hashtags.length > 5 && (
                <span className="text-[10px] text-muted-foreground">+{post.hashtags.length - 5}</span>
              )}
            </div>
          )}
          {post.media_urls.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <ImageIcon className="h-2.5 w-2.5" />
              {post.media_urls.length} attachment{post.media_urls.length > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {post.status === 'pending_approval' && (
            <Button size="sm" variant="ghost" onClick={onApprove} className="h-7 px-2 text-xs gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Approve
            </Button>
          )}
          {post.status === 'approved' && post.scheduled_at && (
            <Button size="sm" variant="ghost" onClick={onSchedule} className="h-7 px-2 text-xs gap-1">
              <Clock className="h-3 w-3" />
              Schedule
            </Button>
          )}
          {(post.status === 'approved' || post.status === 'draft' || post.status === 'failed' || post.status === 'scheduled') && (
            <Button size="sm" variant="ghost" onClick={onPublish} className="h-7 px-2 text-xs gap-1 text-accent hover:text-accent">
              <Send className="h-3 w-3" />
              {post.status === 'failed' ? 'Retry' : post.status === 'scheduled' ? 'Publish Now' : 'Publish'}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onEdit} className="h-7 w-7 p-0">
            <FileEdit className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} className="h-7 w-7 p-0">
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// CALENDAR TAB
// ============================================================

function CalendarTab() {
  const { data: posts } = useCampaignPosts();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState<CampaignPost | null>(null);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
    return days;
  }, [currentDate]);

  const postsByDay = useMemo(() => {
    const map: Record<string, CampaignPost[]> = {};
    for (const post of posts ?? []) {
      const dateStr = post.scheduled_at ?? post.created_at;
      if (!dateStr) continue;
      const d = new Date(dateStr);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(post);
    }
    return map;
  }, [posts]);

  const today = new Date();
  const isToday = (d: Date) =>
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{monthName}</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            className="h-8 px-2 text-xs"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b border-border">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="px-2 py-2 text-center text-[10px] font-semibold uppercase text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        {/* Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, i) => {
            if (!date) return <div key={i} className="min-h-[88px] border-b border-r border-border/50 bg-muted/20" />;
            const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            const dayPosts = postsByDay[key] ?? [];
            return (
              <div
                key={i}
                className={`min-h-[88px] border-b border-r border-border/50 p-1.5 ${
                  isToday(date) ? 'bg-accent/5' : ''
                }`}
              >
                <div className={`mb-1 text-xs ${isToday(date) ? 'font-bold text-accent' : 'text-muted-foreground'}`}>
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayPosts.slice(0, 3).map((post) => {
                    const p = PLATFORM_META[post.platform] ?? PLATFORM_META.facebook;
                    const s = STATUS_META[post.status] ?? STATUS_META.draft;
                    const PIcon = p.icon;
                    return (
                      <button
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        className={`flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[9px] ${s.bg} ${s.color} hover:opacity-80`}
                      >
                        <PIcon className={`h-2.5 w-2.5 shrink-0 ${p.color}`} />
                        <span className="truncate">{post.content?.slice(0, 20) ?? 'Post'}</span>
                      </button>
                    );
                  })}
                  {dayPosts.length > 3 && (
                    <div className="text-[9px] text-muted-foreground px-1">+{dayPosts.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Post detail dialog */}
      <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              {(() => {
                const p = selectedPost ? PLATFORM_META[selectedPost.platform] : null;
                const PIcon = p?.icon ?? Facebook;
                return (
                  <>
                    <PIcon className={`h-4 w-4 ${p?.color ?? ''}`} />
                    {p?.label ?? 'Post'}
                  </>
                );
              })()}
            </DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-3">
              <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_META[selectedPost.status].bg} ${STATUS_META[selectedPost.status].color}`}>
                {STATUS_META[selectedPost.status].label}
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{selectedPost.content}</p>
              {selectedPost.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedPost.hashtags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] text-accent">#{tag}</Badge>
                  ))}
                </div>
              )}
              {selectedPost.scheduled_at && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Scheduled: {formatDateTime(selectedPost.scheduled_at)}
                </div>
              )}
              {selectedPost.published_at && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Published: {formatDateTime(selectedPost.published_at)}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// POST COMPOSER
// ============================================================

function PostComposer({
  open,
  post,
  onClose,
}: {
  open: boolean;
  post?: CampaignPost | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const { data: campaigns } = useCampaigns({ type: 'organic' });
  const { data: socialAccounts } = useSocialAccounts();
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();

  const [campaignId, setCampaignId] = useState('');
  const [platform, setPlatform] = useState<SocialPlatform>('instagram');
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [socialAccountId, setSocialAccountId] = useState('none');
  const [scheduledAt, setScheduledAt] = useState('');
  const [status, setStatus] = useState<PostStatus>('draft');

  // Reset or populate form when dialog opens
  useMemo(() => {
    if (open) {
      if (post) {
        setCampaignId(post.campaign_id);
        setPlatform(post.platform);
        setContent(post.content ?? '');
        setHashtags(post.hashtags.join(', '));
        setMediaUrl(post.media_urls.join(', '));
        setSocialAccountId(post.social_account_id ?? 'none');
        setScheduledAt(post.scheduled_at ? toLocalDateTime(post.scheduled_at) : '');
        setStatus(post.status);
      } else {
        setCampaignId(campaigns?.[0]?.id ?? '');
        setPlatform('instagram');
        setContent('');
        setHashtags('');
        setMediaUrl('');
        setSocialAccountId('none');
        setScheduledAt('');
        setStatus('draft');
      }
    }
  }, [open, post, campaigns]);

  const availableAccounts = (socialAccounts ?? []).filter((a: SocialAccount) => a.platform === platform);

  const handleSave = async () => {
    if (!content.trim()) {
      toast({ title: 'Please enter content', variant: 'destructive' });
      return;
    }
    if (!campaignId) {
      toast({ title: 'Please select a campaign', variant: 'destructive' });
      return;
    }

    const hashtagArray = hashtags
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const mediaArray = mediaUrl
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean);

    const scheduleValue = scheduledAt ? new Date(scheduledAt).toISOString() : null;

    try {
      if (post) {
        await updatePost.mutateAsync({
          id: post.id,
          content,
          hashtags: hashtagArray,
          mediaUrls: mediaArray,
          status: scheduledAt ? 'scheduled' : status,
          scheduledAt: scheduleValue,
        });
        toast({ title: 'Post updated!' });
      } else {
        await createPost.mutateAsync({
          campaignId,
          platform,
          content,
          hashtags: hashtagArray,
          mediaUrls: mediaArray,
          socialAccountId: socialAccountId !== 'none' ? socialAccountId : undefined,
          scheduledAt: scheduleValue ?? undefined,
          status: scheduledAt ? 'scheduled' : status,
        });
        toast({ title: 'Post created!' });
      }
      onClose();
    } catch {
      toast({ title: 'Failed to save post', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {post ? <FileEdit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {post ? 'Edit Post' : 'Create Post'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Platform & campaign */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Platform</Label>
              <Select value={platform} onValueChange={(v) => { setPlatform(v as SocialPlatform); setSocialAccountId('none'); }}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => {
                    const PMeta = PLATFORM_META[p];
                    const PIcon = PMeta.icon;
                    return (
                      <SelectItem key={p} value={p}>
                        <span className="flex items-center gap-1.5">
                          <PIcon className={`h-3 w-3 ${PMeta.color}`} />
                          {PMeta.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Campaign</Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select campaign" />
                </SelectTrigger>
                <SelectContent>
                  {(campaigns ?? []).map((c: Campaign) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <Label className="text-xs">Content</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post content..."
              rows={4}
              className="resize-none text-sm"
            />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{content.length} characters</span>
              <span className="flex items-center gap-0.5">
                <Sparkles className="h-2.5 w-2.5 text-accent" />
                AI optimized
              </span>
            </div>
          </div>

          {/* Hashtags */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Hash className="h-3 w-3" /> Hashtags (comma separated)</Label>
            <Input
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="marketing, branding, growth"
              className="h-9 text-xs"
            />
          </div>

          {/* Media URLs */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Media URLs (comma separated)</Label>
            <Input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="h-9 text-xs"
            />
          </div>

          {/* Social account & schedule */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Connected Account</Label>
              <Select value={socialAccountId} onValueChange={setSocialAccountId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Auto-select</SelectItem>
                  {availableAccounts.map((a: SocialAccount) => (
                    <SelectItem key={a.id} value={a.id}>{a.account_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableAccounts.length === 0 ? (
                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                  <span>No connected {PLATFORM_META[platform].label} account</span>
                  <Link
                    href="/dashboard/settings?tab=integrations"
                    className="text-accent hover:underline flex items-center gap-0.5 font-medium"
                    target="_blank"
                  >
                    Connect <ExternalLink className="h-2.5 w-2.5" />
                  </Link>
                </div>
              ) : (
                <p className="text-[10px] text-emerald-600 pt-0.5">
                  {availableAccounts.length} account{availableAccounts.length > 1 ? 's' : ''} available
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Clock className="h-3 w-3" /> Schedule (optional)</Label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={createPost.isPending || updatePost.isPending}
            className="gap-1.5 bg-accent text-white hover:bg-accent/90"
          >
            {(createPost.isPending || updatePost.isPending) ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {post ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// HELPERS
// ============================================================

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function toLocalDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}
