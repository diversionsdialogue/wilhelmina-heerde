
CREATE TABLE public.pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  eyebrow text,
  excerpt text,
  body_md text,
  cover_image_url text,
  cover_placeholder text,
  status public.content_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  author_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pages: public read published" ON public.pages
  FOR SELECT USING (status = 'published');
CREATE POLICY "pages: editors read all" ON public.pages
  FOR SELECT USING (public.is_content_editor(auth.uid()));
CREATE POLICY "pages: editors insert" ON public.pages
  FOR INSERT WITH CHECK (public.is_content_editor(auth.uid()));
CREATE POLICY "pages: editors update" ON public.pages
  FOR UPDATE USING (public.is_content_editor(auth.uid()))
  WITH CHECK (public.is_content_editor(auth.uid()));
CREATE POLICY "pages: editors delete" ON public.pages
  FOR DELETE USING (public.is_content_editor(auth.uid()));

CREATE TRIGGER pages_set_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO storage.buckets (id, name, public)
VALUES ('page-media', 'page-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "page-media public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'page-media');
CREATE POLICY "page-media editors write" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'page-media' AND public.is_content_editor(auth.uid()));
CREATE POLICY "page-media editors update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'page-media' AND public.is_content_editor(auth.uid()));
CREATE POLICY "page-media editors delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'page-media' AND public.is_content_editor(auth.uid()));
