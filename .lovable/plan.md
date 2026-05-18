
# Plan — Website Koninklijk Fanfarekorps Wilhelmina

## Doel
Het bijgeleverde design (5 pagina's, complete design tokens, herbruikbare blokken) omzetten naar een onderhoudbare TanStack Start website met Lovable Cloud backend. Twee rollen: **admin** (alles + gebruikersbeheer) en **contentbeheerder** (alleen content). n8n-integratie voor formulieren komt later.

---

## 1. Design system overnemen

- Fonts (Roboto + Roboto Slab .ttf) → `public/fonts/` + `@font-face` in `src/styles.css`
- Alle CSS custom properties uit `colors_and_type.css` (`--w-black`, `--w-gold`, `--w-bg-warm`, `--w-bg-sand`, type-scale, spacing, motion) → `src/styles.css` als design tokens, gemapt op shadcn-tokens (`--background` → `--w-bg-warm`, `--primary` → `--w-black`, `--accent` → `--w-gold`, …)
- Logo's (SVG) → `src/assets/`
- Aangeleverde `styles.css` (2144 regels componentstijlen — header, hero, cards, promo, full-bleed, footer, nieuwsbrief) wordt 1:1 overgenomen als globale CSS. Component-classes (`w-hero`, `w-card`, `w-promo`, …) blijven hetzelfde.

## 2. Routes (publieke site)

`src/routes/`:
- `index.tsx` — Home (hero + binnenkort + nieuws + ontdek + steun + nieuwsbrief)
- `optredens.tsx` — alle optredens
- `optredens.$slug.tsx` — optreden detail
- `nieuws.tsx` — alle nieuwsberichten
- `nieuws.$slug.tsx` — nieuwsbericht detail (= huidige `blog.html`)
- `contact.tsx`
- `over.tsx`, `orkesten.tsx`, `steun.tsx` — vrije CMS-pagina's

Gedeelde `SiteHeader` / `SiteFooter` componenten in `src/components/site/`. Sticky scroll-state (over donker → wit) overgenomen uit het design.

## 3. Backend — Lovable Cloud (Supabase)

**Stap 1**: Lovable Cloud aanzetten.

**Tabellen:**

| Tabel | Belangrijke velden |
|---|---|
| `profiles` | `id` (FK auth.users), `display_name`, `created_at` |
| `app_role` (enum) | `admin`, `content_manager` |
| `user_roles` | `user_id`, `role` — aparte tabel (security best practice) |
| `performances` (optredens) | `slug`, `title`, `subtitle`, `starts_at`, `location`, `ensemble`, `description`, `cover_image`, `ticket_url`, `status` (draft/published), `sort_order` |
| `news` | `slug`, `eyebrow` (Interview/Achtergrond/…), `title`, `excerpt`, `body` (markdown), `cover_image`, `author`, `published_at`, `status` |
| `pages` | `slug` (over/orkesten/steun/…), `title`, `hero_image`, `body`, `status` |
| `home_blocks` | `kind` (hero/promo/fullbleed/promo2), `position`, `payload` (jsonb met titel/dek/cta/foto/link), `enabled` — herbruikbare homepage-blokken |
| `newsletters` | `issue_number`, `title`, `published_at`, `payload` jsonb met dezelfde block-types → archief samengesteld uit dezelfde blokken |
| `sponsors` | `id`, `name`, `logo_url`, `website_url`, `tier` (hoofdsponsor/patron/overig), `sort_order`, `enabled` — los invoerveld zodat sliders dynamisch gegenereerd worden |
| `media` | uploads naar Supabase Storage |

**Security definer functie** `has_role(uid, role)` om RLS-recursie te voorkomen.

**RLS:**
- Anon mag lezen waar `status = 'published'` (en alles voor `sponsors` waar `enabled = true`).
- `content_manager` + `admin` mogen alle content lezen/schrijven.
- Alleen `admin` mag `user_roles` muteren.

**Storage bucket**: `media` (publiek read) — voor cover-foto's en sponsor-logo's.

## 4. Authenticatie

- Email + wachtwoord login op `/login`.
- Trigger op `auth.users` → maakt automatisch `profiles` rij.
- **Initiële admin**: na signup voor `william@diversions.nl` zet ik handmatig (SQL) de rol `admin`.
- `/admin/*` beschermd via `_authenticated` layout + role check.
- Publieke pagina's: data via `createServerFn` met `supabaseAdmin` (alleen `published`/`enabled` rijen, expliciete projectie) — voorkomt SSR/prerender 401s.

## 5. Admin paneel (`/admin/*`)

Eenvoudig CMS in shadcn-stijl (los van de site-styling):
- `/admin` — dashboard met counts
- `/admin/optredens` — lijst + create/edit
- `/admin/nieuws` — lijst + create/edit (markdown editor)
- `/admin/homepage` — drag-sort van `home_blocks`, edit van payload (afbeeldingen via Storage)
- `/admin/nieuwsbrieven` — uitgaven samenstellen uit blokken (verwijzingen naar optredens/nieuws of vrije blokken)
- `/admin/pagina's` — vrije pagina's
- `/admin/sponsors` — los formulier: **naam, logo (upload), website-URL, tier, volgorde, zichtbaar** → footer-strip en eventuele logo-slider worden hieruit dynamisch gerenderd
- `/admin/gebruikers` — alleen admin: gebruikers + rollen
- Image uploads → Supabase Storage

Contentbeheerder ziet alles behalve `Gebruikers`.

## 6. Formulieren (contact + nieuwsbrief)

Voor nu: formulieren tonen volgens design, submit-actie is een placeholder server function die nog niets verstuurt (UI-feedback "verzonden ✓" werkt al). Zodra je de n8n webhook hebt, plug ik die in 1 plek in (één secret `N8N_WEBHOOK_URL` + één server function die naar n8n POSTed met `{ type: 'contact'|'newsletter', ...velden }`). Geen verdere wijzigingen aan de UI nodig.

## 7. SEO

- Per route eigen `head()` met titel, description, og:title/description, og:image (uit cover).
- NL/EN toggle in header zichtbaar, EN nog niet ingericht (later).
- `sitemap.xml` en `robots.txt` worden meegeleverd.

## 8. Volgorde van uitvoering

1. Design tokens + fonts + globale CSS overzetten; logo's importeren.
2. Site-shell (Header, Footer, Mobile menu) + route-structuur met statische placeholder content uit het design.
3. Home, Optredens, Nieuws, Contact, detail-pagina's renderen — eerst statisch om het design 1:1 te krijgen.
4. Lovable Cloud aanzetten + schema (tabellen, enum, RLS, trigger, storage).
5. Server functions voor publieke reads; pagina's omzetten naar data uit DB.
6. Auth + `/login` + rolcontrole; admin-rol toekennen aan william@diversions.nl.
7. Admin paneel (optredens → nieuws → home_blocks → sponsors → overige).
8. Contact/nieuwsbrief UI (n8n later).
9. SEO-meta + sitemap.
10. QA per pagina (desktop + mobiel).

## Technische details (kort)

- **TanStack Start v1** + file routing. Geen edge functions; backend-logic in `createServerFn`.
- **Rich text**: markdown-opslag + `react-markdown` voor render.
- **Afbeeldingen**: Supabase Storage; in CMS een file-uploader; op de site lazy `<img>`.
- **Sponsor-slider**: opbouwen uit `sponsors` waar `enabled = true`, gesorteerd op `sort_order`, gerenderd in footer-strip + (optioneel) carousel-blok dat als `home_block` kan worden toegevoegd.
- **State management admin**: TanStack Query met server functions.
- **Toegankelijkheid**: bestaande aria-attributen uit het design behouden, focus-state, skip-link toevoegen.

## Wat ik later nog van je nodig heb
- n8n webhook-URL (voor contact + nieuwsbrief submits).
- Echte foto's en sponsor-logo's (placeholders gebruiken we tot dan).
- Bevestiging na eerste signup van william@diversions.nl, zodat ik de admin-rol kan toekennen.
