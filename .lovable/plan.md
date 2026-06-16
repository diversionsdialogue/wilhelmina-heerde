## Doel
De PageSpeed-melding "Inefficiënte cachebeleid" oplossen voor twee groepen requests:
1. Eigen lettertypes (`/fonts/*.woff2`) — geen Cache-Control header.
2. Afbeeldingen uit Supabase Storage (sponsors/agenda/menu/nieuws/pagina-media) — slechts 1 uur TTL.

## Wat ik ga doen

### 1. Fonts via Vite bundelen (immutable cache)
- Verplaats `public/fonts/*.woff2` naar `src/styles/fonts/`.
- Pas `src/styles/design-tokens.css` aan zodat `@font-face` verwijst naar `./fonts/Roboto-Regular.woff2` enz. (relatief). Vite hasht ze dan en serveert met `Cache-Control: public, max-age=31536000, immutable`.
- Werk de twee `<link rel="preload">` in `src/routes/__root.tsx` bij. Omdat de naam dan hashed is, importeer ik de fonts in het rootbestand als `?url` en geef die URL door aan de preload-links.

Effect: fonts gaan van "geen cache" naar 1 jaar immutable, en wijzigingen zijn veilig dankzij de hash.

### 2. Nieuwe Supabase uploads met lange Cache-Control
In alle bestaande upload-aanroepen `cacheControl: "31536000"` toevoegen (1 jaar):
- `src/routes/_authenticated/admin.sponsors.tsx`
- `src/routes/_authenticated/admin.paginas.tsx`
- `src/routes/_authenticated/admin.nieuws.tsx`
- `src/routes/_authenticated/admin.menu.tsx`
- `src/routes/_authenticated/admin.beeld-en-geluid.tsx`
- `src/routes/_authenticated/admin.agenda.tsx`
- `src/lib/media.functions.ts` (2 calls)

De bestandsnamen in storage zijn al uniek (UUID / slug), dus 1 jaar cache is veilig — bij vervangen wordt sowieso een nieuwe key gegenereerd.

### 3. Bestaande afbeeldingen backfillen
Bestaande objecten in storage houden hun oude `cache-control: max-age=3600` metadata. Ik voeg een admin-only server function toe (`src/lib/storage-cache.functions.ts`) die per bucket alle objecten doorloopt en de metadata bijwerkt door het bestand te downloaden en opnieuw te uploaden met `upsert: true` + nieuwe `cacheControl`. Plus een knop "Cache-headers vernieuwen" op de pagina **Beheer → Instellingen** (admin-only) die deze functie aanroept en voortgang toont.

Buckets die meegenomen worden: `sponsor-logos`, `agenda-media`, `menu-media`, `paginas-media`, `nieuws-media`, `beeld-en-geluid-media` (ik check de exacte bucketnamen tijdens implementatie).

Dit hoef je maar één keer te draaien; daarna zorgen de aangepaste upload-calls automatisch voor de juiste header.

## Wat ik NIET aanraak
- De CSS-bundel (`styles-…css`) — die wordt al immutable gecached, het render-blocking issue daarvan is een aparte discussie.
- Supabase project- of bucketinstellingen.
- Bestaande pagina-layouts of styling.

## Vragen vooraf
Geen — als je akkoord bent, voer ik het uit. De backfill-knop kun je daarna één keer indrukken vanuit Beheer → Instellingen.