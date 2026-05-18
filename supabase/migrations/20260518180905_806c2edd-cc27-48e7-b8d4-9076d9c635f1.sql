-- Sponsors table
CREATE TABLE public.sponsors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  logo_url text,
  website_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sponsors: public read active"
ON public.sponsors FOR SELECT
USING (is_active = true);

CREATE POLICY "sponsors: editors read all"
ON public.sponsors FOR SELECT
USING (public.is_content_editor(auth.uid()));

CREATE POLICY "sponsors: editors insert"
ON public.sponsors FOR INSERT
WITH CHECK (public.is_content_editor(auth.uid()));

CREATE POLICY "sponsors: editors update"
ON public.sponsors FOR UPDATE
USING (public.is_content_editor(auth.uid()))
WITH CHECK (public.is_content_editor(auth.uid()));

CREATE POLICY "sponsors: editors delete"
ON public.sponsors FOR DELETE
USING (public.is_content_editor(auth.uid()));

CREATE TRIGGER sponsors_set_updated_at
BEFORE UPDATE ON public.sponsors
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_sponsors_sort ON public.sponsors (sort_order, name);

-- Storage bucket for sponsor logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('sponsor-logos', 'sponsor-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "sponsor-logos: public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'sponsor-logos');

CREATE POLICY "sponsor-logos: editors insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sponsor-logos' AND public.is_content_editor(auth.uid()));

CREATE POLICY "sponsor-logos: editors update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'sponsor-logos' AND public.is_content_editor(auth.uid()));

CREATE POLICY "sponsor-logos: editors delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'sponsor-logos' AND public.is_content_editor(auth.uid()));