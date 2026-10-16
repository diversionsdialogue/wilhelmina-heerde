# Project rules

- Public-page server reads use `createPublicSupabase()` from `src/lib/supabase-public.server.ts`, never the service-role client — the site is also hosted on Cloudflare where only the public key exists.