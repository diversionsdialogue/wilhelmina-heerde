CREATE TABLE public.hello_bar (
  id integer PRIMARY KEY DEFAULT 1,
  message text NOT NULL DEFAULT '',
  link_url text,
  active boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hello_bar_singleton CHECK (id = 1)
);

GRANT SELECT ON public.hello_bar TO anon, authenticated;
GRANT ALL ON public.hello_bar TO service_role;

ALTER TABLE public.hello_bar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hello bar is public readable"
  ON public.hello_bar FOR SELECT
  USING (true);

CREATE POLICY "Content editors can update hello bar"
  ON public.hello_bar FOR UPDATE
  TO authenticated
  USING (public.is_content_editor(auth.uid()))
  WITH CHECK (public.is_content_editor(auth.uid()));

CREATE POLICY "Content editors can insert hello bar"
  ON public.hello_bar FOR INSERT
  TO authenticated
  WITH CHECK (public.is_content_editor(auth.uid()));

CREATE TRIGGER hello_bar_updated_at
  BEFORE UPDATE ON public.hello_bar
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.hello_bar (id, message, active)
VALUES (1, 'Helaas gaat vanwege het extreme weer ons concert op Vosbergen niet door.', true)
ON CONFLICT (id) DO NOTHING;
