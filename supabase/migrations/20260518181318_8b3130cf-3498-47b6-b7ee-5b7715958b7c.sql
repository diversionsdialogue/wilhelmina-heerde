-- Storage bucket voor menu-banner media
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-media', 'menu-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "menu-media: public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-media');

CREATE POLICY "menu-media: editors insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'menu-media' AND public.is_content_editor(auth.uid()));

CREATE POLICY "menu-media: editors update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'menu-media' AND public.is_content_editor(auth.uid()));

CREATE POLICY "menu-media: editors delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'menu-media' AND public.is_content_editor(auth.uid()));