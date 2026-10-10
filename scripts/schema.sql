-- =========================================================
-- TRIPLE Z — PostgreSQL / Supabase Schema & Seed Data
-- =========================================================

-- 1. Create Products Table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(50) PRIMARY KEY,
  slug VARCHAR(120) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  long_description TEXT,
  price NUMERIC(10, 2),
  currency VARCHAR(10) DEFAULT 'USD',
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  category VARCHAR(50) NOT NULL,
  collection VARCHAR(50) DEFAULT 'core',
  sizes JSONB DEFAULT '["S", "M", "L", "XL"]'::jsonb,
  colors JSONB DEFAULT '["#0a0a0a"]'::jsonb,
  availability VARCHAR(50) DEFAULT 'in-stock',
  is_blurred BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  is_placeholder BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create index on slug and category for rapid lookups
CREATE INDEX IF NOT EXISTS idx_products_slug ON products (slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_collection ON products (collection);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 4. Policies:
-- Allow anyone (public anon) to read products
CREATE POLICY "Allow public read access to products"
  ON products FOR SELECT
  USING (true);

-- Allow authenticated users or service role to insert, update, delete
CREATE POLICY "Allow authenticated insert to products"
  ON products FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update to products"
  ON products FOR UPDATE
  USING (true);

CREATE POLICY "Allow authenticated delete to products"
  ON products FOR DELETE
  USING (true);

-- 5. Seed Data: Insert all initial Triple Z products
INSERT INTO products (
  id, slug, name, description, long_description, price, currency,
  images, category, collection, sizes, colors, availability, is_blurred, featured
) VALUES
(
  'tz-001',
  'triple-z-la-pulga-hoodie',
  'La Pulga Signature Hoodie',
  'Heavyweight loopback fleece hoodie with premium embroidery and contemporary football silhouette.',
  'Crafted from 500gsm custom-milled loopback fleece. Features relaxed dropped shoulders, deep double-layer hood, heavy ribbing at cuffs and hem, and tonal Triple Z crest. Signature football-inspired back embroidery and authentic gold badge details.',
  NULL,
  'USD',
  '[
    {"src": "/products/product-front-hoodie-pedestal.jpg", "alt": "La Pulga Signature Hoodie — Front Pedestal View"},
    {"src": "/products/triple-z-signature-hoodie.png", "alt": "La Pulga Signature Hoodie — Flatlay View"},
    {"src": "/hero-hoodies-pair.jpg", "alt": "La Pulga Signature Hoodie — Pair Pedestal"},
    {"src": "/craft/craft-crest.png", "alt": "La Pulga Signature Hoodie — AFA Gold Crest Detail"},
    {"src": "/craft/craft-embroidery.png", "alt": "La Pulga Signature Hoodie — Triple Z Embroidery Detail"}
  ]'::jsonb,
  'tops',
  'argentina',
  '["S", "M", "L", "XL", "XXL"]'::jsonb,
  '["#4a7c9d", "#0a0a0a", "#b59b6c"]'::jsonb,
  'coming-soon',
  true,
  true
),
(
  'tz-002',
  'triple-z-portugal-heritage-hoodie',
  'Portugal Heritage Hoodie',
  'Deep crimson and forest green block construction with metallic gold crest.',
  '500gsm heavyweight brushed fleece. Contrast color-block paneling inspired by Portuguese football heritage. Custom gold hardware and embroidered heritage crest.',
  NULL,
  'USD',
  '[
    {"src": "/products/portugal-heritage-hoodie.png", "alt": "Portugal Heritage Hoodie"},
    {"src": "/campaign/banner-portugal.png", "alt": "Portugal Heritage Hoodie — Campaign Look"}
  ]'::jsonb,
  'tops',
  'portugal',
  '["S", "M", "L", "XL", "XXL"]'::jsonb,
  '["#8b1e28", "#1c4a2b", "#0a0a0a"]'::jsonb,
  'coming-soon',
  true,
  true
),
(
  'tz-003',
  'triple-z-stadium-track-jacket',
  'Stadium Track Jacket',
  'Technical matte shell with structured contrast panels and custom matte hardware.',
  'The next evolution of pitch outerwear. High-density weather-resistant technical shell, custom gold two-way zip, embroidered sun emblem, and tailored ergonomic sleeves.',
  NULL,
  'USD',
  '[
    {"src": "/products/stadium-track-jacket.png", "alt": "Stadium Track Jacket"},
    {"src": "/craft/craft-stripe.png", "alt": "Stadium Track Jacket — Sun Emblem Detail"}
  ]'::jsonb,
  'outerwear',
  'stadium',
  '["S", "M", "L", "XL"]'::jsonb,
  '["#162332", "#c9a96e", "#0a0a0a"]'::jsonb,
  'coming-soon',
  true,
  true
),
(
  'tz-004',
  'triple-z-pitch-black-tee',
  'Pitch Black Tee',
  'Heavyweight 240gsm cotton tee with golden Triple Z chest embroidery.',
  'Premium 240gsm combed organic cotton tee. Pre-shrunk relaxed boxy fit. Subtle tonal & gold embroidery at center chest. Ribbed collar.',
  NULL,
  'USD',
  '[
    {"src": "/products/pitch-black-tee.png", "alt": "Pitch Black Tee"},
    {"src": "/craft/craft-embroidery.png", "alt": "Pitch Black Tee — Gold Thread Detail"}
  ]'::jsonb,
  'tops',
  'core',
  '["S", "M", "L", "XL", "XXL"]'::jsonb,
  '["#0a0a0a", "#c9a96e", "#2a2a2a"]'::jsonb,
  'coming-soon',
  true,
  true
),
(
  'tz-005',
  'triple-z-messi-10-hoodie',
  'Messi 10 Hoodie',
  'Signature statement piece with golden embroidered 10 and national sun crest.',
  'Commemorative heavyweight hoodie featuring 3D puff embroidery, golden thread details, and signature Argentine sky blue and gold back numbering.',
  NULL,
  'USD',
  '[
    {"src": "/products/product-messi-back-pedestal.jpg", "alt": "Messi 10 Hoodie — Back Numbering"},
    {"src": "/products/argentina-hoodie-dark.png", "alt": "Messi 10 Hoodie — Front View"},
    {"src": "/craft/craft-crest.png", "alt": "Messi 10 Hoodie — AFA 3-Stars Crest"}
  ]'::jsonb,
  'tops',
  'argentina',
  '["S", "M", "L", "XL", "XXL"]'::jsonb,
  '["#68a6d6", "#fafafa", "#0a0a0a"]'::jsonb,
  'coming-soon',
  true,
  true
)
ON CONFLICT (id) DO NOTHING;
