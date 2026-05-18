# Nieuws — import, afbeeldingen, quote & FAQ

Doel: een serie Markdown-bestanden importeren naar `/nieuws`, met automatisch overgenomen afbeeldingen, plus een voorbeeld van een gestileerde quote en een FAQ-accordeon (schema-ready, maar voorlopig alleen als voorbeeld).

## 1. Afbeeldingen — formaat

- Bron: **JPG, liggend 3:2, 1600×1067 px**, ±200–400 KB.
- Header op de detailpagina rendert full-width tot ~1200 px; archive-kaart gebruikt dezelfde afbeelding gecropt naar 3:2 (al zo opgezet).
- Alt-tekst verplicht (later, bij de admin-editor). Auto-varianten (640/960/1440 + WebP) komen later met het Media-blok.

## 2. Markdown-import (`/admin/nieuws/import`)

Beheerscherm met dropzone die accepteert:
- één of meer `.md`-bestanden
- één of meer afbeelding-bestanden (jpg/png/webp), in een map `images/` of los

Verwerking per `.md`:
1. Frontmatter parsen met `gray-matter` → `title`, `slug`, `date` (verplicht), optioneel `eyebrow`, `excerpt`.
2. Body MD doorlopen op `![alt](relatief/pad.jpg)`-referenties.
   - Elke relatieve afbeelding wordt geüpload naar bucket **`news-media`** onder `{slug}/{bestandsnaam}`.
   - De referentie in de body wordt vervangen door de publieke URL.
   - **Eerste afbeelding** in de body wordt automatisch `cover_image_url` (en uit de body gehaald, zodat hij niet dubbel verschijnt). Geen afbeelding → geen cover.
3. Wegschrijven naar `news`:
   - `status = 'published'`
   - `published_at` = `date` uit frontmatter
   - `excerpt` = frontmatter-excerpt, anders eerste ~180 tekens van de body
4. **Bestaande slug → overslaan** (veilig). Per bestand resultaat in het rapport: ✓ geïmporteerd / ⚠ overgeslagen / ✗ fout + reden.

Server-side: één `createServerFn` `importNewsBatch` met `requireSupabaseAuth` + role-check; afbeeldingen via `supabaseAdmin` naar storage.

## 3. Quote-voorbeeld

Werkt al via standaard Markdown:
```md
> Wat een onvergetelijke avond — het orkest speelde alsof het één ademde.
> — Burgemeester Pijnenburg-Adriaenssen
```
Rendert in de bestaande `w-article__quote`-stijl. Geen codewijziging nodig; we documenteren dit in een voorbeeldbericht.

## 4. FAQ-blok (voorbeeld + SCHEMA, voor de toekomst)

Syntax in de MD:
```md
::: faq
### Wanneer is de eerstvolgende uitvoering?
Zie de [agenda](/optredens) voor alle data.

### Kan ik lid worden?
Ja — neem contact op via de [contactpagina](/contact).
:::
```
Rendering:
- Custom remark-achtige pre-processor splitst `::: faq … :::` uit de body.
- Per blok een shadcn `<Accordion type="single" collapsible>` met `### Vraag` als trigger en de markdown daaronder als inhoud.
- Tegelijk wordt een `<script type="application/ld+json">` met `@type: FAQPage` in de `<head>` van de detailpagina gezet (via TanStack `head()` + loader-data).

Scope nu: één **voorbeeldbericht** maken met quote + FAQ, en de render-laag inbouwen. De importer hoeft FAQ niet speciaal te behandelen — gewone tekst die de renderer herkent.

## 5. Technische details

Nieuw / aan te passen:
- Migratie: storage-bucket `news-media` (public read, editor write).
- `src/lib/news.functions.ts` — `importNewsBatch({ files: [{ name, content, ... }] })`.
- `src/routes/_authenticated/admin.nieuws.import.tsx` — UI met dropzone, voortgang, rapport.
- `src/components/site/MarkdownArticle.tsx` — wrapper rond `ReactMarkdown` die `::: faq … :::` uit de body splitst, accordeon rendert en FAQ-schema teruggeeft.
- `src/routes/nieuws.$slug.tsx` — gebruikt `MarkdownArticle`; injecteert FAQ JSON-LD via `head()`.
- Voorbeeldbericht (handmatig of via eerste import) met quote- en FAQ-blok.

Dependencies: `gray-matter` (frontmatter parsing). Geen Node-only packages.

## 6. Volgorde

1. Bucket `news-media` + render-laag (`MarkdownArticle` + FAQ + JSON-LD) + voorbeeldbericht.
2. Importer-serverfunctie + admin-importscherm.
3. Eerste batch echte MD's importeren en steekproef nalopen.
