import { ArrowUp, ArrowDown, PenSquare, Image as ImageIcon, Video } from 'lucide-react';
import { PLAN_PRICING, CREDIT_PACKS } from '@/lib/billing/gateway';
import type { CreditType } from '@/types/database';

export const PLANS = Object.values(PLAN_PRICING).map((p) => ({
  id: p.id,
  name: p.name,
  price: p.priceUsd,
  description:
    p.id === 'free'
      ? 'Perfect for exploring and trying things out'
      : p.id === 'starter'
      ? 'For solo creators and early-stage stores'
      : p.id === 'growth'
      ? 'For scaling brands and marketing teams'
      : p.id === 'agency'
      ? 'For agencies managing multi-brand clients'
      : 'For enterprise marketing organizations',
  features:
    p.id === 'free'
      ? ['1 brand workspace', '10 AI content/mo', '2 AI images/mo', 'Basic social scheduler']
      : p.id === 'starter'
      ? ['3 brands', '100 AI content/mo', '20 AI images/mo', '5 AI videos/mo', '5 social accounts']
      : p.id === 'growth'
      ? ['10 brands', '500 AI content/mo', '100 AI images/mo', '20 AI videos/mo', 'AI Assistant', 'Priority queue']
      : p.id === 'agency'
      ? ['Unlimited brands', '2000 AI content/mo', '500 AI images/mo', '100 AI videos/mo', 'White-label', 'API access']
      : ['Custom brands', '10000 AI content/mo', '3000 AI images/mo', '500 AI videos/mo', 'Dedicated manager'],
  credits: p.credits,
  highlighted: p.id === 'growth',
}));

export const SUB_STATUS_META: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'text-emerald-600 bg-emerald-500/10' },
  trialing: { label: 'Trialing', color: 'text-blue-600 bg-blue-500/10' },
  past_due: { label: 'Past Due', color: 'text-orange-600 bg-orange-500/10' },
  canceled: { label: 'Canceled', color: 'text-muted-foreground bg-muted' },
  unpaid: { label: 'Unpaid', color: 'text-destructive bg-destructive/10' },
};

export const INVOICE_STATUS_META: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'text-muted-foreground bg-muted' },
  open: { label: 'Open', color: 'text-orange-600 bg-orange-500/10' },
  paid: { label: 'Paid', color: 'text-emerald-600 bg-emerald-500/10' },
  void: { label: 'Void', color: 'text-muted-foreground bg-muted' },
  uncollectible: { label: 'Uncollectible', color: 'text-destructive bg-destructive/10' },
};

export const TX_TYPE_META: Record<string, { label: string; icon: typeof ArrowUp; color: string }> = {
  purchase: { label: 'Purchase', icon: ArrowUp, color: 'text-emerald-600' },
  usage: { label: 'Usage', icon: ArrowDown, color: 'text-orange-600' },
  refund: { label: 'Refund', icon: ArrowUp, color: 'text-blue-600' },
  grant: { label: 'Grant', icon: ArrowUp, color: 'text-purple-600' },
};

export const CREDIT_ICONS: Record<CreditType, typeof PenSquare> = {
  content: PenSquare,
  image: ImageIcon,
  video: Video,
};

export { CREDIT_PACKS };
