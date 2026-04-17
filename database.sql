-- ==========================================================
-- TopUpYYY PostgreSQL Database Schema
-- Import via Doxplay / phpPgAdmin / psql:
--   psql -U your_user -d your_db -f database.sql
-- ==========================================================

-- UUID extension (required for gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ──────────────────────────────────────────────────────────
-- Users
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        VARCHAR(255) NOT NULL UNIQUE,
  password     VARCHAR(255),                -- nullable for Google-only users
  full_name    VARCHAR(255),
  avatar_url   VARCHAR(500),
  google_id    VARCHAR(100) UNIQUE,
  is_admin     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- Wallets
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance     NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- Categories
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  image_url   VARCHAR(500),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- Products
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  category      VARCHAR(255) DEFAULT 'Other',
  category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  sub_category  VARCHAR(255) DEFAULT 'Top up',
  image_url     VARCHAR(500),
  custom_fields JSONB DEFAULT '[]'::jsonb,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- Auto APIs
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auto_apis (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  base_url    VARCHAR(500) NOT NULL,
  api_key     VARCHAR(500) DEFAULT '',
  api_type    VARCHAR(50)  DEFAULT 'generic',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- Packages
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS packages (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id               UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name                     VARCHAR(255) NOT NULL,
  price                    NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active                BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order               INT NOT NULL DEFAULT 0,
  auto_topup_enabled       BOOLEAN NOT NULL DEFAULT FALSE,
  auto_api_id              UUID REFERENCES auto_apis(id) ON DELETE SET NULL,
  product_variation_name   VARCHAR(255) DEFAULT '',
  api_tagline              VARCHAR(255) DEFAULT '',
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- Orders
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id        UUID REFERENCES products(id) ON DELETE SET NULL,
  package_id        UUID REFERENCES packages(id) ON DELETE SET NULL,
  game_id           VARCHAR(500) NOT NULL DEFAULT '',
  amount            NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method    VARCHAR(50)  NOT NULL DEFAULT 'wallet',
  status            VARCHAR(50)  NOT NULL DEFAULT 'pending',
  delivery_message  TEXT,
  transaction_id    VARCHAR(255),
  source_url        VARCHAR(500),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_user_id    ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ──────────────────────────────────────────────────────────
-- Banners
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(255) DEFAULT '',
  image_url   VARCHAR(500) NOT NULL,
  link_url    VARCHAR(500),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- Site Settings
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name    VARCHAR(100) NOT NULL UNIQUE,
  value       TEXT DEFAULT '',
  label       VARCHAR(255) DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO site_settings (key_name, value, label) VALUES
  ('site_name',        'TopUpYYY',                            'Site Name'),
  ('notice_text',      '১৮ বছরের নিচে অর্ডার করবেন না।',    'Notice Text'),
  ('notice_enabled',   'true',                                'Notice Enabled'),
  ('whatsapp_number',  '',                                    'WhatsApp Number'),
  ('telegram_link',    '',                                    'Telegram Link'),
  ('facebook_link',    '',                                    'Facebook Link'),
  ('bkash_number',     '',                                    'bKash Number'),
  ('nagad_number',     '',                                    'Nagad Number'),
  ('support_hours',    '9AM - 12PM',                          'Support Hours'),
  ('background_color', '',                                    'Background Color'),
  ('primary_color',    '',                                    'Primary Color'),
  ('notice_color',     '',                                    'Notice Color'),
  ('nav_color',        '',                                    'Header Color'),
  ('footer_color',     '',                                    'Footer Color'),
  ('logo_url',         '',                                    'Logo URL'),
  ('favicon_url',      '',                                    'Favicon URL'),
  ('meta_description', '',                                    'Meta Description'),
  ('google_client_id',     '', 'Google OAuth Client ID'),
  ('google_client_secret', '', 'Google OAuth Client Secret')
ON CONFLICT (key_name) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- Developer Apps (external API keys)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS developer_apps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_name      VARCHAR(255) DEFAULT 'API Key',
  api_key       VARCHAR(64)  NOT NULL DEFAULT REPLACE(gen_random_uuid()::text, '-', ''),
  callback_url  VARCHAR(500),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- Transactions
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
  type            VARCHAR(50) DEFAULT 'deposit',
  payment_method  VARCHAR(50) DEFAULT 'manual',
  status          VARCHAR(50) DEFAULT 'pending',
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- SMS Messages
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sms_messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender              VARCHAR(50) NOT NULL DEFAULT '',
  raw_message         TEXT NOT NULL,
  amount              NUMERIC(10,2),
  transaction_id      VARCHAR(255),
  phone_number        VARCHAR(20),
  sms_balance         NUMERIC(12,2),
  status              VARCHAR(50) DEFAULT 'pending',
  is_used             BOOLEAN NOT NULL DEFAULT FALSE,
  used_for_order_id   UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sms_trx ON sms_messages(transaction_id);

-- ──────────────────────────────────────────────────────────
-- Profiles
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name   VARCHAR(255),
  email       VARCHAR(255),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- Auto-update updated_at trigger function
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'users','wallets','categories','products','auto_apis','packages',
    'orders','banners','site_settings','developer_apps','transactions',
    'sms_messages','profiles'
  ]) LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON %I; CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();',
      t, t
    );
  END LOOP;
END $$;
