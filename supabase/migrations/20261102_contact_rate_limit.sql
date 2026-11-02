-- Apply after provisioning the template's public.inquiries table.
-- The reference schema omitted the column used by the contact API's rate limit.
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS ip text;

CREATE INDEX IF NOT EXISTS inquiries_ip_created_at_idx
  ON public.inquiries (ip, created_at);
