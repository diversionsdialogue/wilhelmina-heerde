-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-media', 'gallery-media', true)
ON CONFLICT (id) DO NOTHING;

-- Albums table
CREATE TABLE public.media_albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  eyebrow text,
  excerpt text,
  body_md text,
  cover_image_url text,
  youtube_url text,
  status content_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  author_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.media_albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_albums: public read published"
  ON public.media_albums FOR SELECT
  USING (status = 'published'::content_status);

CREATE POLICY "media_albums: editors read all"
  ON public.media_albums FOR SELECT
  USING (is_content_editor(auth.uid()));

CREATE POLICY "media_albums: editors insert"
  ON public.media_albums FOR INSERT
  WITH CHECK (is_content_editor(auth.uid()));

CREATE POLICY "media_albums: editors update"
  ON public.media_albums FOR UPDATE
  USING (is_content_editor(auth.uid()))
  WITH CHECK (is_content_editor(auth.uid()));

CREATE POLICY "media_albums: editors delete"
  ON public.media_albums FOR DELETE
  USING (is_content_editor(auth.uid()));

CREATE TRIGGER set_updated_at_media_albums
  BEFORE UPDATE ON public.media_albums
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Photos table
CREATE TABLE public.media_album_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES public.media_albums(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX media_album_photos_album_idx
  ON public.media_album_photos (album_id, sort_order);

ALTER TABLE public.media_album_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_album_photos: public read published"
  ON public.media_album_photos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.media_albums a
    WHERE a.id = album_id AND a.status = 'published'::content_status
  ));

CREATE POLICY "media_album_photos: editors read all"
  ON public.media_album_photos FOR SELECT
  USING (is_content_editor(auth.uid()));

CREATE POLICY "media_album_photos: editors insert"
  ON public.media_album_photos FOR INSERT
  WITH CHECK (is_content_editor(auth.uid()));

CREATE POLICY "media_album_photos: editors update"
  ON public.media_album_photos FOR UPDATE
  USING (is_content_editor(auth.uid()))
  WITH CHECK (is_content_editor(auth.uid()));

CREATE POLICY "media_album_photos: editors delete"
  ON public.media_album_photos FOR DELETE
  USING (is_content_editor(auth.uid()));

-- Storage policies for gallery-media bucket
CREATE POLICY "gallery-media: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery-media');

CREATE POLICY "gallery-media: editors insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gallery-media' AND is_content_editor(auth.uid()));

CREATE POLICY "gallery-media: editors update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'gallery-media' AND is_content_editor(auth.uid()));

CREATE POLICY "gallery-media: editors delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'gallery-media' AND is_content_editor(auth.uid()));