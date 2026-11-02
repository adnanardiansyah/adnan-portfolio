-- REVIEW DRAFT. Not applied by npm install, dev, build, or application startup.
-- Target: a new Neon development branch, PostgreSQL 14+.
-- Dedicated schema: never alters/drops public.*, auth.*, or storage.*.
-- Repeatable for this schema; IF NOT EXISTS does not repair incompatible tables.
-- Inspect preflight.sql first. Resolve any existing schema drift before execution.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
SELECT pg_advisory_xact_lock(52102, 1);

CREATE SCHEMA IF NOT EXISTS portfolio;
REVOKE ALL ON SCHEMA portfolio FROM PUBLIC;

-- Text IDs preserve both the four public slugs and imported legacy UUID strings.
CREATE TABLE IF NOT EXISTS portfolio.works (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Website',
  category_label text NOT NULL DEFAULT '',
  tech text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  image_fit text NOT NULL DEFAULT 'cover' CHECK (image_fit IN ('cover', 'contain')),
  link text,
  sort_order integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  client text NOT NULL DEFAULT '',
  year text NOT NULL DEFAULT '',
  services text NOT NULL DEFAULT '',
  month text NOT NULL DEFAULT '',
  logo_full_view_url text NOT NULL DEFAULT '',
  desktop_view_url text NOT NULL DEFAULT '',
  phone_view_url text NOT NULL DEFAULT '',
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(gallery) = 'array'),
  gallery_layout text NOT NULL DEFAULT 'desktop' CHECK (gallery_layout IN ('desktop', 'mobile')),
  review text NOT NULL DEFAULT '',
  mobile_image_url text NOT NULL DEFAULT '',
  mainimageurl text NOT NULL DEFAULT ''
);

-- Legacy /api/projects is separate from /api/works; retain until consumers retire.
CREATE TABLE IF NOT EXISTS portfolio.projects (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Website',
  tech text NOT NULL DEFAULT '',
  photo_url text NOT NULL DEFAULT '',
  link text,
  review text NOT NULL DEFAULT '',
  num text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(gallery) = 'array'),
  client text NOT NULL DEFAULT '',
  month text NOT NULL DEFAULT '',
  year text NOT NULL DEFAULT '',
  logo_full_view_url text NOT NULL DEFAULT '',
  desktop_view_url text NOT NULL DEFAULT '',
  phone_view_url text NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS portfolio.inquiries (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  ip text NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS portfolio.reviews (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  author text NOT NULL,
  role text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  content text NOT NULL,
  rating smallint NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  approved boolean NOT NULL DEFAULT true,
  avatar text NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS portfolio.settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT 'false'::jsonb
);
CREATE TABLE IF NOT EXISTS portfolio.subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email = lower(btrim(email))),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS portfolio.visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page text NOT NULL DEFAULT '/',
  referrer text NOT NULL DEFAULT '',
  useragent text NOT NULL DEFAULT '',
  ip text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS portfolio.ad_clicks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  label text NOT NULL,
  url text NOT NULL DEFAULT '',
  page text NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS portfolio.searches (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  query text NOT NULL UNIQUE,
  count bigint NOT NULL DEFAULT 1 CHECK (count >= 0),
  last_searched timestamptz NOT NULL DEFAULT now()
);
-- Replaces the concurrent read/overwrite of settings.active_sessions at cutover.
-- Intentionally empty; historical ephemeral sessions need not be imported.
CREATE TABLE IF NOT EXISTS portfolio.active_sessions (
  session_id text PRIMARY KEY,
  page text NOT NULL DEFAULT '/',
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS works_public_order_idx ON portfolio.works (visible, sort_order, created_at DESC);
CREATE INDEX IF NOT EXISTS projects_public_order_idx ON portfolio.projects (visible, sort_order, created_at DESC);
CREATE INDEX IF NOT EXISTS inquiries_ip_created_idx ON portfolio.inquiries (ip, created_at);
CREATE INDEX IF NOT EXISTS inquiries_created_idx ON portfolio.inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_approved_created_idx ON portfolio.reviews (approved, created_at DESC);
CREATE INDEX IF NOT EXISTS visits_created_idx ON portfolio.visits (created_at DESC);
CREATE INDEX IF NOT EXISTS clicks_created_idx ON portfolio.ad_clicks (created_at DESC);
CREATE INDEX IF NOT EXISTS searches_count_idx ON portfolio.searches (count DESC);
CREATE INDEX IF NOT EXISTS sessions_last_seen_idx ON portfolio.active_sessions (last_seen);

-- No anonymous database access. JWT authorization remains in server API routes.
-- Grant a separate runtime role only after manual role setup (see README).
REVOKE ALL ON ALL TABLES IN SCHEMA portfolio FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA portfolio FROM PUBLIC;
COMMIT;
