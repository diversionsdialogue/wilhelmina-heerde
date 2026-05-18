-- Category enum
CREATE TYPE public.agenda_category AS ENUM ('concert', 'educatie', 'optreden');

-- Agenda items
CREATE TABLE public.agenda_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  starts_at timestamptz NOT NULL,
  image_url text,
  category public.agenda_category NOT NULL DEFAULT 'concert',
  location text,
  title text NOT NULL,
  description text,
  hide_on_homepage boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE INDEX idx_agenda_items_starts_at ON public.agenda_items (starts_at);

ALTER TABLE public.agenda_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agenda_items: public read"
ON public.agenda_items FOR SELECT
USING (true);

CREATE POLICY "agenda_items: editors insert"
ON public.agenda_items FOR INSERT
WITH CHECK (public.is_content_editor(auth.uid()));

CREATE POLICY "agenda_items: editors update"
ON public.agenda_items FOR UPDATE
USING (public.is_content_editor(auth.uid()))
WITH CHECK (public.is_content_editor(auth.uid()));

CREATE POLICY "agenda_items: editors delete"
ON public.agenda_items FOR DELETE
USING (public.is_content_editor(auth.uid()));

CREATE TRIGGER trg_agenda_items_updated_at
BEFORE UPDATE ON public.agenda_items
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('agenda-media', 'agenda-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "agenda-media: public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'agenda-media');

CREATE POLICY "agenda-media: editors insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'agenda-media' AND public.is_content_editor(auth.uid()));

CREATE POLICY "agenda-media: editors update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'agenda-media' AND public.is_content_editor(auth.uid()));

CREATE POLICY "agenda-media: editors delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'agenda-media' AND public.is_content_editor(auth.uid()));