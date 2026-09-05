'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  Send,
  Plus,
  Trash2,
  MessageSquare,
  Sparkles,
  Loader2,
  Check,
  X,
  Zap,
  PenSquare,
  CalendarClock,
  DollarSign,
  Target,
  Package,
  TrendingUp,
} from 'lucide-react';
import {
  useConversations,
  useMessages,
  useCreateConversation,
  useDeleteConversation,
  useSendMessage,
  useUpdateMessageAction,
} from '@/hooks/use-assistant';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { cn } from '@/lib/utils';
import type { AiConversation, AiMessage, AiAction } from '@/types/database';

const QUICK_PROMPTS = [
  { label: 'Create a campaign', icon: Zap, prompt: 'Create a new marketing campaign for my product' },
  { label: 'Generate content', icon: PenSquare, prompt: 'Generate Instagram and Facebook content for my brand' },
  { label: 'Schedule posts', icon: CalendarClock, prompt: 'Schedule posts for next week across all platforms' },
  { label: 'Optimize budget', icon: DollarSign, prompt: 'Optimize my ad budget and improve ROAS' },
  { label: 'Analyze performance', icon: TrendingUp, prompt: 'Analyze my campaign performance and suggest improvements' },
  { label: 'Analyze product', icon: Package, prompt: 'Analyze my product and suggest a marketing strategy' },
];

const ACTION_ICONS: Record<AiAction['type'], typeof Zap> = {
  create_campaign: Zap,
  generate_content: PenSquare,
  schedule_post: CalendarClock,
  create_ad: Target,
  optimize_budget: DollarSign,
  analyze_product: Package,
};

export default function AssistantPage() {
  const { toast } = useToast();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AiConversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: convLoading } = useConversations();
  const { data: messages, isLoading: msgLoading } = useMessages(selectedConvId);
  const createConv = useCreateConversation();
  const deleteConv = useDeleteConversation();
  const sendMessage = useSendMessage();
  const updateAction = useUpdateMessageAction();

  // Auto-select first conversation
  useEffect(() => {
    if (!selectedConvId && conversations && conversations.length > 0) {
      setSelectedConvId(conversations[0].id);
    }
  }, [conversations, selectedConvId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewChat = async () => {
    try {
      const conv = await createConv.mutateAsync(undefined);
      setSelectedConvId(conv.id);
      setInput('');
    } catch {
      toast({ title: 'Failed to create conversation', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteConv.mutateAsync(deleteTarget.id);
      if (selectedConvId === deleteTarget.id) setSelectedConvId(null);
      toast({ title: 'Conversation deleted' });
      setDeleteTarget(null);
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleSend = async (customPrompt?: string | unknown) => {
    const content = (typeof customPrompt === 'string' ? customPrompt : input).trim();
    if (!content || sendMessage.isPending) return;

    let convId = selectedConvId;
    if (!convId) {
      try {
        const title = content.length > 35 ? `${content.slice(0, 35)}...` : content;
        const conv = await createConv.mutateAsync(title);
        convId = conv.id;
        setSelectedConvId(conv.id);
      } catch (err: any) {
        toast({ title: 'Failed to create conversation', description: err?.message, variant: 'destructive' });
        return;
      }
    }

    if (!customPrompt) {
      setInput('');
    }

    try {
      await sendMessage.mutateAsync({ conversationId: convId, content });
    } catch (err: any) {
      toast({ title: 'Failed to send message', description: err?.message || 'Please try again', variant: 'destructive' });
      if (!customPrompt) {
        setInput(content);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSend(prompt);
  };

  const handleActionApprove = async (message: AiMessage) => {
    try {
      await updateAction.mutateAsync({
        conversationId: message.conversation_id,
        messageId: message.id,
        actionStatus: 'approved',
      });
      toast({ title: 'Action approved! Executing...' });
    } catch {
      toast({ title: 'Failed to approve action', variant: 'destructive' });
    }
  };

  const handleActionReject = async (message: AiMessage) => {
    try {
      await updateAction.mutateAsync({
        conversationId: message.conversation_id,
        messageId: message.id,
        actionStatus: 'rejected',
      });
      toast({ title: 'Action dismissed' });
    } catch {
      toast({ title: 'Failed to dismiss action', variant: 'destructive' });
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] gap-0">
      {/* Sidebar: Conversation list */}
      <div className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-card/50">
        <div className="p-3 border-b border-border">
          <Button
            onClick={handleNewChat}
            className="w-full gap-1.5 bg-accent text-white hover:bg-accent/90"
            size="sm"
          >
            <Plus className="h-3.5 w-3.5" />
            New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {convLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
              ))
            ) : !conversations || conversations.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <MessageSquare className="mx-auto mb-2 h-6 w-6 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">No conversations yet</p>
              </div>
            ) : (
              (conversations as AiConversation[]).map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={cn(
                    'group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors',
                    selectedConvId === conv.id
                      ? 'bg-accent/10 text-foreground'
                      : 'hover:bg-muted text-muted-foreground'
                  )}
                >
                  <MessageSquare className={cn('h-3.5 w-3.5 shrink-0', selectedConvId === conv.id ? 'text-accent' : '')} />
                  <span className="flex-1 truncate text-xs font-medium">{conv.title}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(conv); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setDeleteTarget(conv); } }}
                    className="opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
              <Bot className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">AI Marketing Assistant</h1>
              <p className="text-[10px] text-muted-foreground">Your always-on marketing employee</p>
            </div>
          </div>
          <Button onClick={handleNewChat} size="sm" variant="outline" className="gap-1.5 md:hidden">
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {!selectedConvId && (!conversations || conversations.length === 0) ? (
            <WelcomeScreen onPrompt={handleQuickPrompt} onNewChat={handleNewChat} />
          ) : msgLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : !messages || messages.length === 0 ? (
            <WelcomeScreen onPrompt={handleQuickPrompt} onNewChat={handleNewChat} />
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {(messages as AiMessage[]).map((msg, idx) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  index={idx}
                  onApprove={() => handleActionApprove(msg)}
                  onReject={() => handleActionReject(msg)}
                />
              ))}
              {sendMessage.isPending && (
                <TypingIndicator />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-border p-4">
          <div className="mx-auto max-w-3xl">
            {/* Quick prompts (show when no messages or always for easy access) */}
            {(!messages || messages.length === 0) && (
              <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {QUICK_PROMPTS.map((qp) => {
                  const Icon = qp.icon;
                  return (
                    <button
                      key={qp.label}
                      onClick={() => handleQuickPrompt(qp.prompt)}
                      className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground transition-all hover:border-accent/30 hover:bg-accent/5 hover:text-foreground"
                    >
                      <Icon className="h-3 w-3 text-accent" />
                      {qp.label}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your AI assistant anything..."
                rows={1}
                className="min-h-[40px] max-h-[120px] resize-none text-sm"
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || sendMessage.isPending}
                className="h-10 w-10 shrink-0 p-0 bg-accent text-white hover:bg-accent/90"
              >
                {sendMessage.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              All messages in this conversation will be permanently deleted.
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

// ============================================================
// WELCOME SCREEN
// ============================================================

function WelcomeScreen({ onPrompt, onNewChat }: { onPrompt: (prompt: string) => void; onNewChat: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto flex max-w-2xl flex-col items-center py-12"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
        <Bot className="h-8 w-8 text-accent" />
      </div>
      <h2 className="text-xl font-bold text-foreground">Your AI Marketing Assistant</h2>
      <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
        I can create campaigns, generate content, analyze performance, optimize budgets, and schedule posts — all through natural conversation.
      </p>

      <div className="mt-6 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {QUICK_PROMPTS.map((qp, i) => {
          const Icon = qp.icon;
          return (
            <motion.button
              key={qp.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * i }}
              onClick={() => { onPrompt(qp.prompt); }}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-all hover:border-accent/30 hover:shadow-sm"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 transition-colors group-hover:bg-accent/20">
                <Icon className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">{qp.label}</p>
                <p className="truncate text-[10px] text-muted-foreground">{qp.prompt}</p>
              </div>
              <Sparkles className="h-3 w-3 text-accent/50 transition-opacity group-hover:opacity-100" />
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ============================================================
// MESSAGE BUBBLE
// ============================================================

function MessageBubble({
  message,
  index,
  onApprove,
  onReject,
}: {
  message: AiMessage;
  index: number;
  onApprove: () => void;
  onReject: () => void;
}) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.15) }}
      className={cn('flex gap-3', isUser && 'flex-row-reverse')}
    >
      {/* Avatar */}
      <div className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
        isUser ? 'bg-muted' : 'bg-accent/10'
      )}>
        {isUser ? (
          <span className="text-xs font-semibold text-muted-foreground">You</span>
        ) : (
          <Bot className="h-4 w-4 text-accent" />
        )}
      </div>

      {/* Content */}
      <div className={cn('flex-1 min-w-0 max-w-[85%]', isUser && 'flex flex-col items-end')}>
        <div className={cn(
          'rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap',
          isUser
            ? 'bg-accent text-white rounded-tr-sm'
            : 'bg-card border border-border text-foreground rounded-tl-sm'
        )}>
          {message.content}
        </div>

        {/* Timestamp */}
        <span className="mt-1 block text-[10px] text-muted-foreground">
          {new Date(message.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </span>

        {/* Action buttons */}
        {!isUser && message.actions.length > 0 && message.action_status === 'pending' && (
          <div className="mt-2 space-y-2 w-full">
            {message.actions.map((action, i) => {
              const ActionIcon = ACTION_ICONS[action.type] ?? Zap;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: 0.1 + i * 0.05 }}
                  className="rounded-lg border border-accent/20 bg-accent/5 p-3"
                >
                  <div className="flex items-center gap-2">
                    <ActionIcon className="h-4 w-4 text-accent" />
                    <span className="text-xs font-semibold text-foreground">
                      {action.label || (action as any).title || 'Action'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Button size="sm" onClick={onApprove} className="h-7 gap-1 bg-accent text-white hover:bg-accent/90 text-xs">
                      <Check className="h-3 w-3" />
                      Approve & Execute
                    </Button>
                    <Button size="sm" variant="outline" onClick={onReject} className="h-7 gap-1 text-xs">
                      <X className="h-3 w-3" />
                      Dismiss
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Action status badge */}
        {!isUser && message.actions.length > 0 && message.action_status !== 'pending' && (
          <div className="mt-2">
            <span className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
              message.action_status === 'approved' || message.action_status === 'executed'
                ? 'bg-emerald-500/10 text-emerald-600'
                : 'bg-muted text-muted-foreground'
            )}>
              {message.action_status === 'approved' || message.action_status === 'executed' ? (
                <><Check className="h-2.5 w-2.5" /> {message.action_status}</>
              ) : (
                <><X className="h-2.5 w-2.5" /> {message.action_status}</>
              )}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// TYPING INDICATOR
// ============================================================

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
        <Bot className="h-4 w-4 text-accent" />
      </div>
      <div className="rounded-xl rounded-tl-sm border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: '0ms' }} />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: '150ms' }} />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </motion.div>
  );
}
