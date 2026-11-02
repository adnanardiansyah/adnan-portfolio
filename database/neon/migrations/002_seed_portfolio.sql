-- REVIEW DRAFT. Run manually ONLY after 001 on the reviewed development branch.
-- Four existing projects/assets only. Does not overwrite CMS edits on reruns.
-- Not an import of legacy Supabase data. No fabricated clients, tech or reviews.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
SELECT pg_advisory_xact_lock(52102, 1);

INSERT INTO portfolio.works
  (id, title, description, category, category_label, link, image_url,
   image_fit, gallery, gallery_layout, sort_order)
VALUES
  ('snapnext', 'SnapNext',
   'A photo booth SaaS website presenting QRIS payment flows, instant printing, GIF creation, and digital galleries.',
   'Website', 'Photo booth · SaaS', 'https://photobox-saas-main-ews1.vercel.app/',
   '/images/projects/snapnext/cover.webp', 'cover',
   '["/images/projects/snapnext/cover.webp"]'::jsonb, 'desktop', 0),
  ('triase-net', 'TRIASE-Net',
   'A student complaint platform focused on secure communication, reporting, and follow-up across campus services.',
   'Website', 'Student services', 'https://triase-net-rouge.vercel.app/',
   '/images/projects/triase-net/cover.webp', 'cover',
   '["/images/projects/triase-net/cover.webp"]'::jsonb, 'desktop', 1),
  ('suara-digital-desa', 'Suara Digital Desa',
   'A village budget transparency platform presenting APBDes information, public participation, and privacy policies.',
   'Website', 'Village transparency', 'https://suges-privacy-policy.vercel.app/',
   '/images/projects/suara-digital-desa/cover.webp', 'contain',
   '["/images/projects/suara-digital-desa/mobile-1.webp","/images/projects/suara-digital-desa/mobile-2.webp","/images/projects/suara-digital-desa/mobile-3.webp","/images/projects/suara-digital-desa/mobile-4.webp","/images/projects/suara-digital-desa/mobile-5.webp"]'::jsonb,
   'mobile', 2),
  ('siskamling', 'Siskamling Digital',
   'A digital neighborhood security project for patrol coordination, community reporting, and emergency communication. KMIPN 2026; a public demo URL has not been provided.',
   'App', 'App · KMIPN 2026', NULL,
   '/images/projects/siskamling/cover.webp', 'cover',
   '["/images/projects/siskamling/cover.webp"]'::jsonb, 'desktop', 3)
ON CONFLICT (id) DO NOTHING;

-- Keep optional gates disabled by default; preserve existing values on rerun.
INSERT INTO portfolio.settings (key, value) VALUES
  ('coming_soon', 'false'::jsonb),
  ('social_links', '{"github":"https://github.com/adnanardiansyah","linkedin":"https://www.linkedin.com/in/adnanardiansyah/"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
COMMIT;
