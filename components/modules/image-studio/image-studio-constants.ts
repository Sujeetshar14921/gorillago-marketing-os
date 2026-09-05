import {
  Image as ImageIcon,
  Package,
  PanelTop,
  FileImage,
  BookImage,
  Film,
  GalleryHorizontalEnd,
  Tag,
  PartyPopper,
  Shirt,
  Box,
  Mic2,
  Upload,
  Palette,
  Megaphone,
} from 'lucide-react';
import type { MediaCategory } from '@/types/database';

export interface CategoryInfo {
  label: string;
  icon: typeof ImageIcon;
  color: string;
  desc: string;
}

export const CATEGORIES: Record<MediaCategory, CategoryInfo> = {
  product_image: { label: 'Product Image', icon: Package, color: 'text-emerald-600', desc: 'Clean studio product shots' },
  banner: { label: 'Banner', icon: PanelTop, color: 'text-blue-600', desc: 'Wide marketing banners' },
  poster: { label: 'Poster', icon: FileImage, color: 'text-amber-600', desc: 'Eye-catching posters' },
  story: { label: 'Story', icon: BookImage, color: 'text-pink-500', desc: 'Vertical social stories' },
  thumbnail: { label: 'Thumbnail', icon: ImageIcon, color: 'text-teal-600', desc: 'Video thumbnails' },
  reel: { label: 'Reel Cover', icon: Film, color: 'text-rose-600', desc: 'Reel & video covers' },
  carousel: { label: 'Carousel', icon: GalleryHorizontalEnd, color: 'text-violet-600', desc: 'Multi-slide carousels' },
  offer_banner: { label: 'Offer Banner', icon: Tag, color: 'text-orange-600', desc: 'Sale & promo banners' },
  festival_banner: { label: 'Festival Banner', icon: PartyPopper, color: 'text-red-600', desc: 'Seasonal & festive' },
  lifestyle_mockup: { label: 'Lifestyle Mockup', icon: Shirt, color: 'text-green-600', desc: 'In-context lifestyle shots' },
  product_mockup: { label: 'Product Mockup', icon: Box, color: 'text-cyan-600', desc: 'Mockup templates' },
  voiceover: { label: 'Voiceover', icon: Mic2, color: 'text-purple-600', desc: 'Audio waveform visuals' },
  user_upload: { label: 'Upload', icon: Upload, color: 'text-gray-600', desc: 'Your uploaded images' },
  brand_asset: { label: 'Brand Asset', icon: Palette, color: 'text-indigo-600', desc: 'Logos & brand elements' },
  campaign_asset: { label: 'Campaign Asset', icon: Megaphone, color: 'text-sky-600', desc: 'Campaign visuals' },
};

export const FILTER_GROUPS: { label: string; categories: MediaCategory[] }[] = [
  { label: 'Social', categories: ['story', 'carousel', 'reel', 'thumbnail'] },
  { label: 'Marketing', categories: ['banner', 'poster', 'offer_banner', 'festival_banner', 'campaign_asset'] },
  { label: 'Product', categories: ['product_image', 'product_mockup', 'lifestyle_mockup'] },
  { label: 'Brand', categories: ['brand_asset', 'voiceover', 'user_upload'] },
];

export const PLATFORM_OPTIONS = ['Instagram', 'Facebook', 'LinkedIn', 'X', 'Pinterest', 'Email', 'Website'];
