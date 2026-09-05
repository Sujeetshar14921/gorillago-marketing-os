/*
# AI Content Generations and Media Assets

1. Purpose
Stores AI-generated text content (captions, blog posts, ad copy, emails, landing pages, SEO)
and all media assets (uploaded + AI-generated images and videos). Media assets are referenced
by campaigns, posts, and ads.

2. New Tables
- `content_generations`
  - `id` (uuid, pk)
  - `organization_id` (uuid, fk → organizations)
  - `product_id` (uuid, fk → products, nullable)
  - `campaign_id` (uuid, fk → campaigns, nullable)
  - `type` (text) — instagram_caption, facebook_caption, linkedin_post, x_post, pinterest_description,
            telegram_message, whatsapp_message, email_campaign, landing_page_copy, ad_copy,
            product_description, seo_meta, headline, blog_article, multi_language
  - `platform` (text, nullable) — target platform for the content
  - `content` (text) — generated text
  - `language` (text, default 'en')
  - `tone` (text)
  - `model` (text) — AI model used
  - `prompt` (text) — input prompt that generated this
  - `tokens_used` (integer)
  - `status` (text: generating, completed, failed)
  - `is_approved` (boolean, default false)
  - `created_by` (uuid, fk → auth.users)
  - `created_at`, `updated_at`

- `media_assets`
  - `id` (uuid, pk)
  - `organization_id` (uuid, fk → organizations)
  - `product_id` (uuid, fk → products, nullable)
  - `campaign_id` (uuid, fk → campaigns, nullable)
  - `type` (text: image, video, document)
  - `category` (text: product_image, banner, poster, story, thumbnail, reel, carousel, offer_banner,
              festival_banner, lifestyle_mockup, product_mockup, voiceover, user_upload, brand_asset, campaign_asset)
  - `url` (text) — storage URL
  - `thumbnail_url` (text)
  - `platform` (text, nullable) — if resized for a specific platform
  - `dimensions` (jsonb) — { width, height }
  - `format` (text) — png, jpg, mp4, webp, etc.
  - `file_size_bytes` (bigint)
  - `ai_generated` (boolean, default false)
  - `ai_prompt` (text) — prompt used to generate (if AI-generated)
  - `model` (text) — generation model (if AI-generated)
  - `metadata` (jsonb) — extra info (duration for videos, alt text, etc.)
  - `created_by` (uuid, fk → auth.users)
  - `created_at`, `updated_at`

3. Indexes
- content_generations on organization_id, type, product_id, campaign_id
- media_assets on organization_id, type, category, product_id

4. Security
- RLS enabled. SELECT for org members; writes for org editors.
*/

-- =========================================================
-- CONTENT GENERATIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS content_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  type text NOT NULL
    CHECK (type IN ('instagram_caption','facebook_caption','linkedin_post','x_post','pinterest_description',
                    'telegram_message','whatsapp_message','email_campaign','landing_page_copy','ad_copy',
                    'product_description','seo_meta','headline','blog_article','multi_language')),
  platform text,
  content text,
  language text NOT NULL DEFAULT 'en',
  tone text,
  model text,
  prompt text,
  tokens_used integer,
  status text NOT NULL DEFAULT 'generating'
    CHECK (status IN ('generating','completed','failed')),
  is_approved boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE content_generations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_content_gen_org_id ON content_generations(organization_id);
CREATE INDEX IF NOT EXISTS idx_content_gen_type ON content_generations(type);
CREATE INDEX IF NOT EXISTS idx_content_gen_product_id ON content_generations(product_id);
CREATE INDEX IF NOT EXISTS idx_content_gen_campaign_id ON content_generations(campaign_id);

DROP POLICY IF EXISTS "select_org_content_gen" ON content_generations;
CREATE POLICY "select_org_content_gen"
  ON content_generations FOR SELECT
  TO authenticated
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS "insert_org_content_gen" ON content_generations;
CREATE POLICY "insert_org_content_gen"
  ON content_generations FOR INSERT
  TO authenticated
  WITH CHECK (is_org_editor(organization_id));

DROP POLICY IF EXISTS "update_org_content_gen" ON content_generations;
CREATE POLICY "update_org_content_gen"
  ON content_generations FOR UPDATE
  TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

DROP POLICY IF EXISTS "delete_org_content_gen" ON content_generations;
CREATE POLICY "delete_org_content_gen"
  ON content_generations FOR DELETE
  TO authenticated
  USING (is_org_admin(organization_id));

DROP TRIGGER IF EXISTS trg_content_gen_updated_at ON content_generations;
CREATE TRIGGER trg_content_gen_updated_at
  BEFORE UPDATE ON content_generations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- MEDIA ASSETS
-- =========================================================
CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('image','video','document')),
  category text NOT NULL
    CHECK (category IN ('product_image','banner','poster','story','thumbnail','reel','carousel',
                        'offer_banner','festival_banner','lifestyle_mockup','product_mockup',
                        'voiceover','user_upload','brand_asset','campaign_asset')),
  url text NOT NULL,
  thumbnail_url text,
  platform text,
  dimensions jsonb,
  format text,
  file_size_bytes bigint,
  ai_generated boolean NOT NULL DEFAULT false,
  ai_prompt text,
  model text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_media_assets_org_id ON media_assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_type ON media_assets(type);
CREATE INDEX IF NOT EXISTS idx_media_assets_category ON media_assets(category);
CREATE INDEX IF NOT EXISTS idx_media_assets_product_id ON media_assets(product_id);

DROP POLICY IF EXISTS "select_org_media_assets" ON media_assets;
CREATE POLICY "select_org_media_assets"
  ON media_assets FOR SELECT
  TO authenticated
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS "insert_org_media_assets" ON media_assets;
CREATE POLICY "insert_org_media_assets"
  ON media_assets FOR INSERT
  TO authenticated
  WITH CHECK (is_org_editor(organization_id));

DROP POLICY IF EXISTS "update_org_media_assets" ON media_assets;
CREATE POLICY "update_org_media_assets"
  ON media_assets FOR UPDATE
  TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

DROP POLICY IF EXISTS "delete_org_media_assets" ON media_assets;
CREATE POLICY "delete_org_media_assets"
  ON media_assets FOR DELETE
  TO authenticated
  USING (is_org_admin(organization_id));

DROP TRIGGER IF EXISTS trg_media_assets_updated_at ON media_assets;
CREATE TRIGGER trg_media_assets_updated_at
  BEFORE UPDATE ON media_assets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();