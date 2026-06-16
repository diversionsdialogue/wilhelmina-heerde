## Doel
Op `/admin` echte bezoekersstatistieken tonen (in plaats van placeholders), via een eigen lichte, cookieloze tracker. Privacy-vriendelijk: geen persoonlijke data, IP wordt gehasht, geen cookies.

## Stappen

### 1. Database — `page_views` tabel
Nieuwe migratie:
- `id uuid pk`
- `created_at timestamptz default now()`
- `path text` (bv. `/agenda`)
- `referrer text` (host van referrer, of `direct`)
- `session_id text` (random id, 30 min sliding, in `sessionStorage` — geen cookie)
- `visitor_hash text` (sha256 van IP + user-agent + dag-salt, server-side berekend — niet herleidbaar)
- `device text` (`mobile` | `tablet` | `desktop`)
- `country text` (optioneel via Cloudflare header `cf-ipcountry`)
- Indexen op `created_at`, `path`

RLS:
- INSERT toegestaan voor `anon` + `authenticated` (tracker werkt voor iedereen)
- SELECT alleen voor admin/content_manager (via `has_role`)
- GRANTs: `INSERT TO anon, authenticated`, `SELECT TO authenticated`, `ALL TO service_role`

### 2. Server endpoint — `POST /api/public/track`
Server route (geen auth, snel, fire-and-forget):
- Leest `path`, `referrer`, `session_id`, `device` uit body
- Berekent `visitor_hash` server-side uit `cf-connecting-ip` + UA + dagelijks roterend salt
- Leest `cf-ipcountry` header
- Schrijft één regel via `supabaseAdmin` 
- Skipt bot-UA's en admin/auth paden
- Retourneert 204 direct

### 3. Client tracker
Klein script in `src/routes/__root.tsx` dat luistert op route-changes (`router.subscribe('onResolved')`):
- Sla niet op voor `/admin*`, `/auth*`, `/api*`
- Haal of maak `session_id` (sessionStorage, TTL 30 min)
- Bepaal device via viewport
- `navigator.sendBeacon('/api/public/track', …)` zodat het niet blokkeert

### 4. Aggregatie-server functies (`src/lib/analytics.functions.ts`)
Authenticated (`requireSupabaseAuth` + rolcheck content editor):
- `getDashboardStats(period)` → unieke bezoekers, pageviews, gem. pageviews/sessie, bouncerate
- `getViewsTimeseries(period)` → dagelijkse reeks voor de grafiek
- `getTopPages(period)` → top 10 paden
- `getTrafficSources(period)` → groepering op referrer-host (Google, Facebook, direct, …)
- `getDeviceBreakdown(period)` → mobile/tablet/desktop %
- `getRecentActivity()` → laatste 20 pageviews

### 5. Admin dashboard activeren
`src/routes/_authenticated/admin.index.tsx` herschrijven:
- Periode-filter (`today` / `7d` / `30d` / `90d` / `year`) blijft, plus delta tov vorige periode
- 4 stat-cards met echte cijfers + delta
- Grafiek via bestaande chart-component (recharts) op timeseries
- 4 panels (top pagina's, bronnen, apparaten, recente activiteit) met echte data
- "Cache legen" knop blijft

## Privacy-noot
Geen cookies, geen profielvorming, IP wordt nooit opgeslagen — alleen een dagelijks roterende hash. Voldoet aan AVG zonder cookiemelding.

## Bestanden
- nieuw: migratie `page_views` + RLS + GRANTs
- nieuw: `src/routes/api/public/track.ts`
- nieuw: `src/lib/analytics.functions.ts`
- nieuw: `src/components/admin/AnalyticsChart.tsx`
- gewijzigd: `src/routes/__root.tsx` (tracker)
- gewijzigd: `src/routes/_authenticated/admin.index.tsx` (echte data)
