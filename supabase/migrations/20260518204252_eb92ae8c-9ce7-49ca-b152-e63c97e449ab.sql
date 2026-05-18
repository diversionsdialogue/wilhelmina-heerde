INSERT INTO storage.buckets (id, name, public) VALUES ('news-media', 'news-media', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "news-media: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'news-media');

CREATE POLICY "news-media: editors insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'news-media' AND public.is_content_editor(auth.uid()));

CREATE POLICY "news-media: editors update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'news-media' AND public.is_content_editor(auth.uid()));

CREATE POLICY "news-media: editors delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'news-media' AND public.is_content_editor(auth.uid()));