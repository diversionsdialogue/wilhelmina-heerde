
# Beheeromgeving — definitief plan

Gekozen uitgangspunten (op basis van jouw antwoorden):
- **Statistieken**: starten met wat Lovable Cloud / onze eigen tabel kan bieden (zie sectie 9). Later eventueel uitbreiden.
- **Versiehistorie**: ja, **max 3 revisies** per item (oudste rolt eruit).
- **Concept + geplande publicatie**: ja.
- **Preview-link** voor concepten (signed, zonder login): ja.
- **SEO per item**: ja (meta-titel, -omschrijving, OG-image, indexeerbaar).
- **Afbeeldingen optimaliseren**: ja, automatisch bij upload (meerdere formaten + WebP).
- **Meertaligheid**: nee.
- **2FA**: nee.
- Wél meenemen (geen extra vraag): **audit log**, **redirects**, **alt-tekst verplicht**, **back-up-export**.

---

## 1. Toegang & rollen

- `/login` (bestaat).
- `/admin/*` afgeschermd via `_authenticated` + role-check.
- Rollen: **admin** (alles) en **content_manager** (alle content; geen gebruikers/instellingen).
- Eerste admin: `william@diversions.nl`.

## 2. Layout van het beheer

```text
┌─────────────────────────────────────────────────────────┐
│  Wilhelmina · Beheer        zoek…    [naam ▾] uitloggen │
├──────────────┬──────────────────────────────────────────┤
│ Dashboard    │                                          │
│ Homepage     │                                          │
│ Menu         │            (inhoud per pagina)           │
│ Nieuws       │                                          │
│ Agenda       │                                          │
│ Pagina's     │                                          │
│ Sponsors     │                                          │
│ Media        │                                          │
│ Redirects    │                                          │
│ ──────────── │                                          │
│ Gebruikers   │  (alleen admin)                          │
│ Instellingen │  (alleen admin)                          │
└──────────────┴──────────────────────────────────────────┘
```

Eigen, strakke shadcn-stijl, los van de publieke site. Inklapbare sidebar, mobiel responsive.

## 3. Dashboard

Bovenaan een **periode-selector**: vandaag / 7 dagen / 30 dagen / 90 dagen / dit jaar / aangepast.

- **Kerncijfers** (4 tegels): unieke bezoekers, paginaweergaves, gem. sessieduur, bouncepercentage — met % verandering t.o.v. vorige periode.
- **Bezoekersgrafiek** (lijn over tijd).
- **Meest bezochte pagina's** — top 10.
- **Bronnen** — direct / zoekmachine / social / referrals.
- **Apparaten** — desktop / mobiel / tablet.
- **Snelle acties** — "Nieuw bericht", "Nieuwe agenda", "Nieuwe pagina".
- **Recente activiteit** — laatste 10 wijzigingen (uit audit log).

## 4. Beheer per onderdeel

### a) Homepage — blokken (drag-sort)
Hero • Binnenkort (auto uit Agenda) • Nieuws-strook (auto, aantal instelbaar) • Promo-blokken (vrij) • Full-bleed-blok • Sponsors-strook • Nieuwsbrief-band. Per blok: zichtbaar/volgorde/payload.

### b) Menu
Header (mega-menu kolommen) + footer-kolommen + de "Zelf muziek maken — start direct" banner. Drag-sort, label + URL of interne pagina-koppeling.

### c) Nieuws
Lijst met filters; editor met titel/slug/eyebrow/excerpt/markdown-body/cover/publicatiedatum/status. Concept → plan-publicatie → gepubliceerd → depubliceren. SEO-veld + preview-link + revisies (max 3).

### d) Agenda (optredens)
Lijst (komend/verleden, filter op ensemble); editor met titel/slug/datum+tijd/locatie/ensemble/beschrijving/cover/ticket-URL/status. Automatisch depubliceren na einddatum (optie).

### e) Pagina's
Vrije pagina's (over, orkesten, steun, bestuur, dirigent, opleiding, lid worden, beeld & geluid, contact, …): titel/slug/hero/body (markdown of blokken)/SEO/status.

### f) Sponsors
Naam, logo (upload), website, tier (hoofd/patron/overig), volgorde, zichtbaar. Automatisch in footer-strip + sponsorblok.

### g) Media
Bibliotheek (uploads), kopieer-URL, alt-tekst **verplicht**, vervangen, verwijderen. Bij upload: auto-resize naar meerdere breedtes + WebP-variant; origineel bewaard.

### h) Redirects
Tabel van → naar (301/302), zoekbaar. 404-rapport (top 20 niet-bestaande URL's van de afgelopen periode) met "maak redirect"-knop.

## 5. Universele content-features (gelden voor Nieuws, Agenda, Pagina's)

- **Status**: concept / gepland / gepubliceerd / gedepubliceerd.
- **Geplande publicatie**: datum/tijd in de toekomst — cron-job zet status op gepubliceerd.
- **Preview-link**: knop "Deel preview" → kopieert signed URL (`?preview=<token>`) die 7 dagen geldig is, geen login nodig.
- **Revisies**: bij elke "Opslaan/Publiceren" wordt een snapshot bewaard. **Max 3** — bij de 4e rolt de oudste eruit. Knop "Herstel naar deze versie".
- **SEO per item**: meta-titel, meta-omschrijving, OG-image override, indexeerbaar ja/nee.
- **Audit log**: wie/wat/wanneer geregistreerd, zichtbaar onder elk item én op dashboard.

## 6. Gebruikersbeheer (alleen admin)

- Lijst (naam, e-mail, rol, laatste login).
- Uitnodigen via e-mail (wachtwoord-set link).
- Rol wijzigen, deactiveren, verwijderen.

## 7. Instellingen (alleen admin)

- Algemeen: sitenaam, contactgegevens, social links.
- SEO defaults: title-suffix, default OG-image, favicon, `robots.txt`-toggle.
- Integraties: webhook-URL voor nieuwsbrief (n8n) en contactformulier-ontvangers.
- Back-up: knop "Exporteer alle content als JSON".

## 8. UX-conventies

Auto-save concept • ⌘S opslaan • ⌘K snel zoeken • bevestigingsdialoog bij verwijderen • lege-state-teksten ("Nog geen berichten — maak je eerste bericht") • toast bij opslaan/publiceren • preview-knop opent publieke pagina in nieuw tabblad.

## 9. Statistieken — startaanpak (Lovable Cloud)

Lovable Cloud biedt geen kant-en-klaar analytics-product voor eindbezoekers. Wat we wél kunnen doen, zonder externe tool en zonder cookiebanner:

- **Eigen `page_view`-tabel** in onze database. Een minieme client-side tracker stuurt per paginabezoek: pad, timestamp, referrer (zonder query), user-agent (geparseerd naar device-type), geanonimiseerd IP (alleen om unieke bezoekers per dag te tellen — hash, niet opgeslagen).
- Server function aggregeert dit naar de dashboard-cijfers (kerncijfers, top-pagina's, bronnen, apparaten, lijn over tijd).
- AVG-vriendelijk (geen externe partij, geen cookie nodig), maar minder rijk dan Google Analytics (geen demografie, geen funnels). Voor jullie doel — "hoeveel mensen, welke pagina's, waar vandaan" — ruim voldoende.

Als later blijkt dat je meer wilt (campagnes, conversies), kunnen we Plausible/Umami koppelen zonder iets aan de site te verbouwen — alleen het dashboard verandert van bron.

---

## 10. Technische details (kort)

Nieuwe tabellen die nog moeten:
- `performances`, `pages`, `home_blocks`, `menu_items`, `sponsors`, `media`, `media_variants`
- `redirects`, `not_found_log`
- `audit_log`, `revisions` (met trigger die >3 snapshots per item opruimt)
- `settings` (key/value)
- `scheduled_publications` (cron-rij voor gepland publiceren/depubliceren)
- `page_views` (statistieken — zie 9)
- `preview_tokens` (token + item-ref + verloopdatum)

Verder:
- Storage bucket `media` (publiek read) + tweede bucket `media-private` voor concept-previews.
- Beeld-optimalisatie: bij upload één server function die varianten genereert (320/640/960/1440 px + WebP). De `<img>` in de site krijgt `srcset`/`sizes` automatisch.
- Server functions voor CRUD met `requireSupabaseAuth` + role-check (`is_content_editor` / `has_role`).
- Cron (Supabase pg_cron of TanStack server route + extern scheduler): elke 5 min geplande publicaties verwerken; dagelijks `page_views` aggregeren.
- Audit log via Postgres trigger op alle content-tabellen.

---

## 11. Bouwvolgorde

1. **Admin-skelet**: layout, sidebar, lege secties, role-check, dashboard met dummy-cijfers.
2. **Statistieken-pijplijn**: `page_views`-tabel + tracker + aggregatie → echte cijfers op dashboard.
3. **Nieuws** als referentie-implementatie (concept/gepland/preview/revisies/SEO — alles).
4. **Agenda** (zelfde patroon, plus datum/tijd-logica).
5. **Pagina's**.
6. **Media + afbeelding-optimalisatie** (parallel aan 3–5 nodig zodra eerste upload binnenkomt).
7. **Homepage-blokken** (drag-sort + payload-editors).
8. **Menu**.
9. **Sponsors**.
10. **Redirects + 404-rapport**.
11. **Gebruikersbeheer + Instellingen**.
12. **Back-up-export** + audit-log-weergave verfijnen.

Iedere stap is na oplevering bruikbaar zonder dat de volgende klaar hoeft te zijn.

---

Klaar om te starten met stap 1 (admin-skelet + dashboard) zodra je dit plan goedkeurt.
