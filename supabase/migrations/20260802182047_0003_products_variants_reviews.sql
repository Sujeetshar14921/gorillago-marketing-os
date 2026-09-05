/*
# Products, Variants, and Reviews

1. Purpose
Stores imported products from manual entry, CSV, Shopify, WooCommerce, Magento, BigCommerce,
or direct URL. Each product can have variants (size/color/style), reviews, AI analysis results,
images, and metadata.

2. New Tables
- `products`
  - `id` (uuid, pk)
  - `organization_id` (uuid, fk → organizations)
  - `brand_id` (uuid, fk → brands, nullable)
  - `name` (text)
  - `description` (text)
  - `category` (text)
  - `subcategory` (text)
  - `price` (numeric(12,2))
  - `compare_at_price` (numeric(12,2)) — original/sale price
  - `currency` (text, default 'USD')
  - `sku` (text)
  - `barcode` (text)
  - `status` (text: draft, active, archived)
  - `source` (text: manual, csv, shopify, woocommerce, magento, bigcommerce, url)
  - `source_url` (text) — original product URL or store URL
  - `external_id` (text) — ID in the source system
  - `images` (jsonb) — array of image URLs
  - `videos` (jsonb) — array of video URLs
  - `tags` (text[]) — searchable tags
  - `seo_title` (text)
  - `seo_description` (text)
  - `seo_keywords` (text[])
  - `inventory_count` (integer, default 0)
  - `inventory_status` (text: in_stock, low_stock, out_of_stock)
  - `metadata` (jsonb) — flexible extra fields from source system
  - `ai_analysis` (jsonb) — AI-generated analysis (category, audience, keywords, competitors, USP, etc.)
  - `ai_analysis_completed_at` (timestamptz)
  - `created_at`, `updated_at`

- `product_variants`
  - `id` (uuid, pk)
  - `product_id` (uuid, fk → products, cascade)
  - `name` (text) — e.g. "Large / Red"
  - `sku` (text)
  - `price` (numeric(12,2))
  - `inventory_count` (integer, default 0)
  - `attributes` (jsonb) — { color: "red", size: "L" }
  - `created_at`, `updated_at`

- `product_reviews`
  - `id` (uuid, pk)
  - `product_id` (uuid, fk → products, cascade)
  - `author` (text)
  - `rating` (integer, 1-5)
  - `title` (text)
  - `content` (text)
  - `source` (text) — e.g. shopify, amazon, manual
  - `source_url` (text)
  - `created_at`

3. Indexes
- products on organization_id, status, source, created_at
- product_variants on product_id
- product_reviews on product_id

4. Security
- RLS enabled. SELECT for any org member; INSERT/UPDATE/DELETE for org admins and marketing_manager+.
- product_variants and product_reviews inherit access via parent product membership check.
*/

-- =========================================================
-- PRODUCTS
-- =========================================================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES brands(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  category text,
  subcategory text,
  price numeric(12,2),
  compare_at_price numeric(12,2),
  currency text NOT NULL DEFAULT 'USD',
  sku text,
  barcode text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','archived')),
  source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual','csv','shopify','woocommerce','magento','bigcommerce','url')),
  source_url text,
  external_id text,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  videos jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags text[] NOT NULL DEFAULT '{}',
  seo_title text,
  seo_description text,
  seo_keywords text[] NOT NULL DEFAULT '{}',
  inventory_count integer NOT NULL DEFAULT 0,
  inventory_status text NOT NULL DEFAULT 'in_stock'
    CHECK (inventory_status IN ('in_stock','low_stock','out_of_stock')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_analysis jsonb,
  ai_analysis_completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_products_org_id ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_source ON products(source);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Helper: can the current user write to this org (admin or marketing_manager+)
CREATE OR REPLACE FUNCTION is_org_editor(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_id = p_org_id
      AND user_id = auth.uid()
      AND status = 'active'
      AND role IN ('super_admin','agency_owner','business_owner','marketing_manager','content_manager')
  );
$$;

DROP POLICY IF EXISTS "select_org_products" ON products;
CREATE POLICY "select_org_products"
  ON products FOR SELECT
  TO authenticated
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS "insert_org_products" ON products;
CREATE POLICY "insert_org_products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (is_org_editor(organization_id));

DROP POLICY IF EXISTS "update_org_products" ON products;
CREATE POLICY "update_org_products"
  ON products FOR UPDATE
  TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

DROP POLICY IF EXISTS "delete_org_products" ON products;
CREATE POLICY "delete_org_products"
  ON products FOR DELETE
  TO authenticated
  USING (is_org_admin(organization_id));

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- PRODUCT VARIANTS
-- =========================================================
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text,
  price numeric(12,2),
  inventory_count integer NOT NULL DEFAULT 0,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

DROP POLICY IF EXISTS "select_org_product_variants" ON product_variants;
CREATE POLICY "select_org_product_variants"
  ON product_variants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_variants.product_id
        AND is_org_member(products.organization_id)
    )
  );

DROP POLICY IF EXISTS "insert_org_product_variants" ON product_variants;
CREATE POLICY "insert_org_product_variants"
  ON product_variants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_variants.product_id
        AND is_org_editor(products.organization_id)
    )
  );

DROP POLICY IF EXISTS "update_org_product_variants" ON product_variants;
CREATE POLICY "update_org_product_variants"
  ON product_variants FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_variants.product_id
        AND is_org_member(products.organization_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_variants.product_id
        AND is_org_editor(products.organization_id)
    )
  );

DROP POLICY IF EXISTS "delete_org_product_variants" ON product_variants;
CREATE POLICY "delete_org_product_variants"
  ON product_variants FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_variants.product_id
        AND is_org_admin(products.organization_id)
    )
  );

DROP TRIGGER IF EXISTS trg_product_variants_updated_at ON product_variants;
CREATE TRIGGER trg_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- PRODUCT REVIEWS
-- =========================================================
CREATE TABLE IF NOT EXISTS product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  author text,
  rating integer NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  title text,
  content text,
  source text NOT NULL DEFAULT 'manual',
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);

DROP POLICY IF EXISTS "select_org_product_reviews" ON product_reviews;
CREATE POLICY "select_org_product_reviews"
  ON product_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_reviews.product_id
        AND is_org_member(products.organization_id)
    )
  );

DROP POLICY IF EXISTS "insert_org_product_reviews" ON product_reviews;
CREATE POLICY "insert_org_product_reviews"
  ON product_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_reviews.product_id
        AND is_org_editor(products.organization_id)
    )
  );

DROP POLICY IF EXISTS "update_org_product_reviews" ON product_reviews;
CREATE POLICY "update_org_product_reviews"
  ON product_reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_reviews.product_id
        AND is_org_member(products.organization_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_reviews.product_id
        AND is_org_editor(products.organization_id)
    )
  );

DROP POLICY IF EXISTS "delete_org_product_reviews" ON product_reviews;
CREATE POLICY "delete_org_product_reviews"
  ON product_reviews FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_reviews.product_id
        AND is_org_admin(products.organization_id)
    )
  );