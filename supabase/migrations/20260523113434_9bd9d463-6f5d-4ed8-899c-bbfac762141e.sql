
CREATE TABLE public.quickscan_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audience text NOT NULL,
  experience text,
  prev_instrument text,
  rejoin_choice text,
  chosen_instrument text,
  switcher boolean NOT NULL DEFAULT false,
  exit_type text NOT NULL,
  preference text NOT NULL,
  name text,
  phone text,
  email text NOT NULL,
  notes text,
  subject text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quickscan_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Editors can view leads"
ON public.quickscan_leads FOR SELECT
TO authenticated
USING (public.is_content_editor(auth.uid()));

CREATE POLICY "Editors can delete leads"
ON public.quickscan_leads FOR DELETE
TO authenticated
USING (public.is_content_editor(auth.uid()));
