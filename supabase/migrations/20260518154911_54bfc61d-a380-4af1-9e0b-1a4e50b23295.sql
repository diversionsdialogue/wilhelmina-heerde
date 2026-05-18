
-- Tabel voor beheerbare secties op de homepage (hero, banner).
CREATE TABLE public.home_sections (
  key text PRIMARY KEY,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;

-- Publiek leesbaar (homepage haalt content op zonder login)
CREATE POLICY "home_sections: public read"
  ON public.home_sections
  FOR SELECT
  USING (true);

-- Alleen content-editors mogen wijzigen
CREATE POLICY "home_sections: editors update"
  ON public.home_sections
  FOR UPDATE
  USING (public.is_content_editor(auth.uid()))
  WITH CHECK (public.is_content_editor(auth.uid()));

CREATE POLICY "home_sections: editors insert"
  ON public.home_sections
  FOR INSERT
  WITH CHECK (public.is_content_editor(auth.uid()));

-- updated_at trigger
CREATE TRIGGER tg_home_sections_updated_at
  BEFORE UPDATE ON public.home_sections
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Seed met huidige inhoud van de homepage
INSERT INTO public.home_sections (key, payload) VALUES
  ('hero', jsonb_build_object(
    'eyebrow', 'Koninklijk Fanfarekorps Wilhelmina',
    'title', 'Seizoen 2026',
    'subtitle', 'Verstilling & vuur',
    'text', 'Drie orkesten, twaalf concerten en een nieuwe compositie van huiscomponist Anouk Veldman — een seizoen tussen ingetogen kamermuziek en groot fanfaregeluid.',
    'primary_label', 'Concertagenda',
    'primary_href', '/optredens',
    'secondary_label', 'Bekijk de series',
    'secondary_href', '/nieuws'
  )),
  ('banner', jsonb_build_object(
    'title', 'Programmaboek 26/27',
    'text', 'Een bijzondere kennismaking met het seizoen — dirigent, musici en het volledige programma van fanfareorkest, slagwerkensemble en opleidingsorkest.',
    'button_label', 'Bekijk de concerten',
    'button_href', '/optredens'
  ));
