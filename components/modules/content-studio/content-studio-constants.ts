import {
  PenLine,
  Search,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Mail,
  FileText,
  Megaphone,
  Package,
  Globe,
  Type,
  Newspaper,
  MessageCircle,
  Send,
} from 'lucide-react';
import type { ContentType } from '@/types/database';

export interface ContentTypeInfo {
  label: string;
  icon: typeof PenLine;
  color: string;
  placeholder: string;
}

export const CONTENT_TYPES: Record<ContentType, ContentTypeInfo> = {
  instagram_caption: { label: 'Instagram Caption', icon: Instagram, color: 'text-pink-500', placeholder: 'Describe what you want to post about...' },
  facebook_caption: { label: 'Facebook Post', icon: Facebook, color: 'text-blue-600', placeholder: 'What\'s your post about?' },
  linkedin_post: { label: 'LinkedIn Post', icon: Linkedin, color: 'text-blue-700', placeholder: 'Share a professional insight or announcement...' },
  x_post: { label: 'X (Twitter) Post', icon: Twitter, color: 'text-sky-500', placeholder: 'What\'s on your mind?' },
  pinterest_description: { label: 'Pinterest Description', icon: FileText, color: 'text-red-600', placeholder: 'Describe your pin...' },
  telegram_message: { label: 'Telegram Message', icon: Send, color: 'text-sky-600', placeholder: 'Write your broadcast message...' },
  whatsapp_message: { label: 'WhatsApp Message', icon: MessageCircle, color: 'text-green-600', placeholder: 'Write your WhatsApp message...' },
  email_campaign: { label: 'Email Campaign', icon: Mail, color: 'text-orange-600', placeholder: 'What\'s your email about?' },
  landing_page_copy: { label: 'Landing Page', icon: FileText, color: 'text-teal-600', placeholder: 'Describe your product or offer...' },
  ad_copy: { label: 'Ad Copy', icon: Megaphone, color: 'text-amber-600', placeholder: 'What are you advertising?' },
  product_description: { label: 'Product Description', icon: Package, color: 'text-emerald-600', placeholder: 'Describe the product...' },
  seo_meta: { label: 'SEO Meta', icon: Search, color: 'text-purple-600', placeholder: 'Enter your target keyword or topic...' },
  headline: { label: 'Headline', icon: Type, color: 'text-rose-600', placeholder: 'What\'s the topic?' },
  blog_article: { label: 'Blog Article', icon: Newspaper, color: 'text-indigo-600', placeholder: 'What\'s your article topic?' },
  multi_language: { label: 'Multi-Language', icon: Globe, color: 'text-cyan-600', placeholder: 'Enter content to translate...' },
};

export const TONE_OPTIONS = [
  'professional', 'playful', 'luxury', 'casual',
  'authoritative', 'friendly', 'inspirational', 'witty',
];

export const FILTER_CATEGORIES: { label: string; types: ContentType[] }[] = [
  { label: 'Social Media', types: ['instagram_caption', 'facebook_caption', 'linkedin_post', 'x_post', 'pinterest_description', 'telegram_message', 'whatsapp_message'] },
  { label: 'Marketing', types: ['email_campaign', 'landing_page_copy', 'ad_copy'] },
  { label: 'Product', types: ['product_description', 'seo_meta', 'headline'] },
  { label: 'Long Form', types: ['blog_article', 'multi_language'] },
];
