## Doel

De oude WordPress-site (`wilhelmina-heerde.nl`) wordt vervangen door deze nieuwe site. Op dit moment is er **geen enkele redirect** geregeld — alle oude indexposities en externe links breken straks. We zetten 301-redirects op zodat bezoekers en Google soepel overgaan, plus een 404-rapport zodat je later gemiste URLs kunt zien en handmatig kunt toevoegen.

Aanpak (jouw keuzes): redirects **statisch in code**, lijst opgebouwd uit de **WordPress-sitemap**, **404-rapport meteen meenemen**.

## Wat is er nu?

- Admin → Redirects is een lege "Coming Soon" pagina.
- Geen server-route, geen middleware, geen database-tabel.
- Bezoekers van oude URLs krijgen straks 404 zonder spoor.

## Wat we gaan bouwen

### 1. Catch-all server route met statische redirect-tabel

Nieuwe file `src/routes/$.tsx` (splat) die elk pad afhandelt dat de router anders 404 zou geven:

1. Pad opzoeken in een **statische map** `OLD_TO_NEW` (TypeScript object).
2. Match → 301 redirect via TanStack's `redirect({ to, code: 301, throw: true })` in `beforeLoad`.
3. Geen match → 404 loggen in DB, dan TanStack's standaard not-found tonen.

### 2. Redirect-tabel (opgebouwd uit jouw sitemap)

Drie soorten regels:

**a) Vaste 1-op-1 mappings** (pagina's met andere slug):
```
/agenda/                    → /optredens
/media/                     → /beeld-en-geluid
/contact/                   → /contact
/nieuws/                    → /nieuws
/steun-ons-via-sponsorkliks/ → /steun
/home/sponsoren/            → /sponsoren
/privacy-policy-privacybeleid/ → /p/privacy-policy-privacybeleid
```

**b) Pagina-slugs die 1-op-1 onder `/p/` leven nu** (uit `pages` tabel):
`/dirigent/`, `/bestuur/`, `/hessenblazers/`, `/wilhelminaband/`, `/a-orkest/`, `/wilhelmina-nieuw-talent/`, `/zelf-muziek-maken/`, `/oud-papier-inzameling/`, `/lid-worden/` → `/p/<slug>`

**c) Nieuwsartikelen** (84 posts): pad `/<slug>/` → `/nieuws/<slug>` als die slug in de `news` tabel staat. We genereren deze lijst eenmalig uit de sitemap × DB-match en plakken hem in code. Slugs die geen match hebben (bv. oude posts die nooit zijn overgezet) worden niet geredirect en verschijnen in het 404-log → zelf beslissen of je ze later toevoegt.

**d) Patroon-redirects** (regex, voor sitemap-groepen):
```
/category/.*                → /nieuws
/author/.*                  → /
/home/sponsoren/[^/]+/      → /sponsoren  (individuele sponsorpagina's)
/media/<slug>/              → /beeld-en-geluid/<slug>  als slug in albums bestaat,
                              anders → /beeld-en-geluid
```

**e) Restjes** (`/t-soerel/`, `/tijdelijk/`, oude attachment-URLs): geen redirect → 404 met log; jij kunt later in het log zien of het de moeite waard is.

### 3. 404-log tabel

Migration voor nieuwe tabel `not_found_log`:
- `id`, `path`, `referrer`, `user_agent`, `hit_count`, `first_seen_at`, `last_seen_at`
- Upsert op `path`: nieuwe rij of `hit_count + 1, last_seen_at = now()`.
- RLS: alleen `admin` mag lezen; `service_role` schrijft via serverFn.
- GRANTs volgens template.

Schrijven gebeurt via een `createServerFn` die de catch-all aanroept (server-side, niet vanuit de browser, zodat scrapers de tabel niet kunnen vervuilen via JS).

### 4. Admin-pagina "Redirects" wordt 404-rapport

`src/routes/_authenticated/admin.redirects.tsx` (nu Coming Soon) wordt vervangen door:
- Lijst van 404's gesorteerd op `hit_count` desc.
- Per rij: pad, aantal hits, laatst gezien, referrer.
- Knop "Verwijderen" (één rij) en "Alles wissen".
- Bovenaan een statische sectie "Actieve redirects" die de hard-coded tabel toont (read-only, ter referentie).

Geen UI om redirects toe te voegen — die staan in code zoals je vroeg.

### 5. Sitemap-route check

Geen wijziging nodig: nieuwe site heeft al z'n eigen routes. Eventueel nog een aparte taak.

## Technische details

**File-layout:**
```
src/lib/redirects.ts              // OLD_TO_NEW map + regex regels + matchRedirect()
src/lib/not-found-log.functions.ts // logNotFound serverFn (service_role insert)
src/routes/$.tsx                   // catch-all: match → 301, else log + 404
src/routes/_authenticated/admin.redirects.tsx  // herschreven naar 404-rapport
supabase/migrations/xxxx_not_found_log.sql
```

**Catch-all werking** (`src/routes/$.tsx`):
```text
beforeLoad({ location }) {
  const target = matchRedirect(location.pathname);
  if (target) throw redirect({ to: target, code: 301 });
  // niet-match: log async (fire-and-forget), gooi notFound()
}
```

Belangrijk: deze splat-route mag **alleen matchen voor onbekende paden**. TanStack's file-based routing geeft bestaande routes voorrang boven `$.tsx`, dus dat klopt automatisch.

**Slash-normalisatie:** alle keys in `OLD_TO_NEW` opslaan zonder trailing slash; bij lookup eerst slash strippen.

**Query/fragment behouden:** `?utm_…` doorzetten naar de nieuwe URL.

## Buiten scope

- Beheerbare redirects via UI (afgewezen → "statisch in code").
- Redirects voor andere domeinen dan paden binnen deze site.
- Sitemap aanpassen of bij Google indienen (apart traject).
- E-mailmeldingen bij nieuwe 404's.

## Resultaat

Na implementatie:
- Elke oude WordPress-URL met een logische opvolger geeft 301 → nieuwe URL.
- Onbekende paden tonen 404 én komen in `/admin/redirects` te staan; jij beslist wekelijks of er nog regels bij moeten in de code.
- Klaar om live te gaan zonder verlies van SEO-waarde op de overgezette content.
