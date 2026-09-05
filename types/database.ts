// =========================================================
// GorillaGO Database Types
// Auto-derived from the Supabase schema migrations.
// =========================================================

export type UserRole =
  | 'super_admin'
  | 'agency_owner'
  | 'business_owner'
  | 'marketing_manager'
  | 'content_manager'
  | 'viewer';

export type MemberStatus = 'active' | 'invited' | 'revoked';

export type Plan = 'free' | 'starter' | 'growth' | 'agency' | 'enterprise';

export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'pinterest'
  | 'youtube'
  | 'x'
  | 'telegram'
  | 'threads';

export type AdPlatform =
  | 'meta_ads'
  | 'google_ads'
  | 'linkedin_ads'
  | 'pinterest_ads'
  | 'x_ads';

export type IntegrationType =
  | 'shopify'
  | 'woocommerce'
  | 'magento'
  | 'bigcommerce'
  | 'google_ads'
  | 'meta_ads'
  | 'linkedin_ads'
  | 'pinterest_ads'
  | 'x_ads'
  | 'stripe'
  | 'openai'
  | 'anthropic';

export type ProductStatus = 'draft' | 'active' | 'archived';
export type ProductSource =
  | 'manual'
  | 'csv'
  | 'shopify'
  | 'woocommerce'
  | 'magento'
  | 'bigcommerce'
  | 'url';

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export type CampaignType = 'organic' | 'paid' | 'hybrid';
export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'active'
  | 'paused'
  | 'completed'
  | 'archived'
  | 'failed';

export type CampaignGoal =
  | 'awareness'
  | 'engagement'
  | 'traffic'
  | 'leads'
  | 'sales'
  | 'followers';

export type CampaignObjective = CampaignGoal;

export type PostStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'scheduled'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'recurring';

export type AdStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'active'
  | 'paused'
  | 'archived'
  | 'failed';

export type AdObjective =
  | 'awareness'
  | 'reach'
  | 'traffic'
  | 'engagement'
  | 'leads'
  | 'app_installs'
  | 'video_views'
  | 'conversions'
  | 'store_traffic'
  | 'sales';

export type BidStrategy = 'lowest_cost' | 'cost_cap' | 'bid_cap' | 'target_cost';

export type ContentType =
  | 'instagram_caption'
  | 'facebook_caption'
  | 'linkedin_post'
  | 'x_post'
  | 'pinterest_description'
  | 'telegram_message'
  | 'whatsapp_message'
  | 'email_campaign'
  | 'landing_page_copy'
  | 'ad_copy'
  | 'product_description'
  | 'seo_meta'
  | 'headline'
  | 'blog_article'
  | 'multi_language';

export type MediaType = 'image' | 'video' | 'document';

export type MediaCategory =
  | 'product_image'
  | 'banner'
  | 'poster'
  | 'story'
  | 'thumbnail'
  | 'reel'
  | 'carousel'
  | 'offer_banner'
  | 'festival_banner'
  | 'lifestyle_mockup'
  | 'product_mockup'
  | 'voiceover'
  | 'user_upload'
  | 'brand_asset'
  | 'campaign_asset';

export type NotificationType =
  | 'campaign_published'
  | 'campaign_failed'
  | 'post_published'
  | 'budget_finished'
  | 'token_expired'
  | 'ai_completed_generation'
  | 'new_product_imported'
  | 'system_alert'
  | 'team_invite'
  | 'billing_alert'
  | 'recommendation';

export type RecommendationType =
  | 'optimize_campaign'
  | 'increase_budget'
  | 'pause_ad'
  | 'refresh_content'
  | 'connect_account'
  | 'schedule_post'
  | 'target_audience'
  | 'creative_variation'
  | 'budget_warning'
  | 'token_expired';

export type RecommendationPriority = 'low' | 'medium' | 'high' | 'critical';
export type RecommendationStatus = 'pending' | 'approved' | 'dismissed' | 'executed';

// =========================================================
// Row types
// =========================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: UserRole;
  status: MemberStatus;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  organization_id: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  font_family: string | null;
  tone_of_voice: string | null;
  language: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSettings {
  id: string;
  organization_id: string;
  timezone: string;
  default_language: string;
  ai_tone: string | null;
  ai_model: string;
  auto_pilot_enabled: boolean;
  auto_pilot_auto_publish: boolean;
  auto_pilot_auto_ads: boolean;
  notification_email: boolean;
  notification_push: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  organization_id: string;
  brand_id: string | null;
  name: string;
  description: string | null;
  category: string | null;
  subcategory: string | null;
  price: number | null;
  compare_at_price: number | null;
  currency: string;
  sku: string | null;
  barcode: string | null;
  status: ProductStatus;
  source: ProductSource;
  source_url: string | null;
  external_id: string | null;
  images: string[];
  videos: string[];
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[];
  inventory_count: number;
  inventory_status: InventoryStatus;
  metadata: Record<string, unknown>;
  ai_analysis: Record<string, unknown> | null;
  ai_analysis_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialAccount {
  id: string;
  organization_id: string;
  platform: SocialPlatform;
  account_name: string;
  account_id: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  scopes: string[];
  health_status: 'healthy' | 'expired' | 'error' | 'disconnected';
  last_health_check_at: string | null;
  metadata: Record<string, unknown>;
  is_connected: boolean;
  created_at: string;
  updated_at: string;
}

export type IntegrationStatus = 'connected' | 'disconnected' | 'error';

export interface Integration {
  id: string;
  organization_id: string;
  type: IntegrationType;
  name: string;
  status: IntegrationStatus;
  credentials: Record<string, unknown>;
  metadata: Record<string, unknown>;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}


export interface Campaign {
  id: string;
  organization_id: string;
  product_id: string | null;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  goal: CampaignGoal | null;
  budget: number | null;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  target_country: string[];
  target_language: string | null;
  ai_generated: boolean;
  ai_estimated_performance: Record<string, unknown> | null;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CampaignPost {
  id: string;
  campaign_id: string;
  organization_id: string;
  social_account_id: string | null;
  platform: SocialPlatform;
  content: string | null;
  media_urls: string[];
  hashtags: string[];
  status: PostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  external_post_id: string | null;
  error_message: string | null;
  is_recurring: boolean;
  recurrence_rule: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignAd {
  id: string;
  campaign_id: string;
  organization_id: string;
  platform: AdPlatform;
  ad_account_id: string | null;
  objective: AdObjective;
  audience: Record<string, unknown>;
  placements: unknown[];
  daily_budget: number | null;
  lifetime_budget: number | null;
  bid_strategy: BidStrategy;
  creative: Record<string, unknown>;
  status: AdStatus;
  external_ad_id: string | null;
  error_message: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ContentGenerationStatus = 'generating' | 'completed' | 'failed';

export interface ContentGeneration {
  id: string;
  organization_id: string;
  product_id: string | null;
  campaign_id: string | null;
  type: ContentType;
  platform: string | null;
  content: string | null;
  language: string;
  tone: string | null;
  model: string | null;
  prompt: string | null;
  tokens_used: number | null;
  status: ContentGenerationStatus;
  is_approved: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaAsset {
  id: string;
  organization_id: string;
  product_id: string | null;
  campaign_id: string | null;
  type: MediaType;
  category: MediaCategory;
  url: string;
  thumbnail_url: string | null;
  platform: string | null;
  dimensions: { width?: number; height?: number } | null;
  format: string | null;
  file_size_bytes: number | null;
  ai_generated: boolean;
  ai_prompt: string | null;
  model: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  organization_id: string;
  user_id: string | null;
  type: NotificationType;
  title: string;
  message: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AnalyticsSnapshot {
  id: string;
  organization_id: string;
  entity_type: 'campaign' | 'post' | 'ad' | 'social_account' | 'organization';
  entity_id: string;
  platform: string | null;
  date: string;
  metrics: Record<string, number>;
  ai_suggestion: string | null;
  created_at: string;
}

export interface AiConversation {
  id: string;
  organization_id: string;
  title: string;
  status: 'active' | 'archived';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiMessage {
  id: string;
  conversation_id: string;
  organization_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  actions: AiAction[];
  action_status: 'pending' | 'approved' | 'rejected' | 'executed';
  model: string | null;
  tokens_used: number | null;
  created_at: string;
}

export interface AiAction {
  type: 'create_campaign' | 'generate_content' | 'schedule_post' | 'create_ad' | 'optimize_budget' | 'analyze_product';
  label: string;
  data?: Record<string, unknown>;
}

export interface AiRecommendation {
  id: string;
  organization_id: string;
  type: RecommendationType;
  title: string;
  description: string | null;
  priority: RecommendationPriority;
  status: RecommendationStatus;
  entity_type: string | null;
  entity_id: string | null;
  action_data: Record<string, unknown>;
  dismissed_by: string | null;
  approved_by: string | null;
  acted_at: string | null;
  created_at: string;
}

export type BillingPlan = 'free' | 'starter' | 'growth' | 'agency' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
export type CreditTransactionType = 'purchase' | 'usage' | 'refund' | 'grant';
export type CreditType = 'content' | 'image' | 'video';

export interface BillingSubscription {
  id: string;
  organization_id: string;
  plan: BillingPlan;
  status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  seats: number;
  created_at: string;
  updated_at: string;
}

export interface BillingInvoice {
  id: string;
  organization_id: string;
  subscription_id: string | null;
  stripe_invoice_id: string | null;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  invoice_url: string | null;
  invoice_pdf: string | null;
  period_start: string | null;
  period_end: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface BillingCredits {
  id: string;
  organization_id: string;
  ai_content_credits: number;
  ai_image_credits: number;
  ai_video_credits: number;
  total_used_content: number;
  total_used_image: number;
  total_used_video: number;
  created_at: string;
  updated_at: string;
}

export interface BillingCreditTransaction {
  id: string;
  organization_id: string;
  type: CreditTransactionType;
  credit_type: CreditType;
  amount: number;
  balance_after: number | null;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_redemptions: number | null;
  redemptions_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
