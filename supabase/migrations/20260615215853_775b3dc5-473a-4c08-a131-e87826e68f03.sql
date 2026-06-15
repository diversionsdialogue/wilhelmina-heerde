CREATE TABLE public.not_found_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL UNIQUE,
  hit_count integer NOT NULL DEFAULT 1,
  last_referrer text,
  last_user_agent text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX not_found_log_hit_count_idx ON public.not_found_log (hit_count DESC, last_seen_at DESC);

GRANT SELECT, DELETE ON public.not_found_log TO authenticated;
GRANT ALL ON public.not_found_log TO service_role;

ALTER TABLE public.not_found_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Editors can view 404 log"
  ON public.not_found_log FOR SELECT
  TO authenticated
  USING (public.is_content_editor(auth.uid()));

CREATE POLICY "Editors can clear 404 log"
  ON public.not_found_log FOR DELETE
  TO authenticated
  USING (public.is_content_editor(auth.uid()));