
CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  email text NOT NULL,
  source text,
  brevo_synced boolean NOT NULL DEFAULT false,
  brevo_error text,
  user_agent text,
  ip text
);

CREATE UNIQUE INDEX newsletter_subscribers_email_lower_uq ON public.newsletter_subscribers (lower(email));
CREATE INDEX newsletter_subscribers_created_at_idx ON public.newsletter_subscribers (created_at DESC);

GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can subscribe"
  ON public.newsletter_subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "admins can read subscribers"
  ON public.newsletter_subscribers FOR SELECT
  TO authenticated
  USING (public.is_content_editor(auth.uid()));

CREATE POLICY "admins can update subscribers"
  ON public.newsletter_subscribers FOR UPDATE
  TO authenticated
  USING (public.is_content_editor(auth.uid()))
  WITH CHECK (public.is_content_editor(auth.uid()));

CREATE POLICY "admins can delete subscribers"
  ON public.newsletter_subscribers FOR DELETE
  TO authenticated
  USING (public.is_content_editor(auth.uid()));

CREATE TRIGGER newsletter_subscribers_set_updated_at
  BEFORE UPDATE ON public.newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
