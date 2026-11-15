DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
DROP POLICY IF EXISTS "anyone can subscribe" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Anyone can submit a contact form" ON public.contact_submissions;
REVOKE INSERT ON public.page_views FROM anon;
REVOKE INSERT ON public.newsletter_subscribers FROM anon;
REVOKE INSERT ON public.contact_submissions FROM anon;