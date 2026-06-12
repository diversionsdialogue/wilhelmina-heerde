# Contactformulier afhandeling

## Doel
Inzendingen via `/contact` worden:
1. Opgeslagen in Lovable Cloud (tabel `contact_submissions`) — zodat niets verloren gaat als n8n offline is.
2. Direct doorgestuurd naar de n8n webhook:
   `https://diversions-connect-u67534.vm.elestio.app/webhook/c952ba94-63c9-4b88-81ac-d1858f2d545b`

## Wijzigingen

### 1. Database
Nieuwe tabel `public.contact_submissions`:
- `id` (uuid, pk)
- `created_at` (timestamptz)
- `first_name`, `last_name`, `email`, `phone`, `message` (text)
- `consent` (boolean)
- `forwarded_to_n8n` (boolean) — true als webhook 2xx teruggaf
- `n8n_error` (text, nullable) — foutmelding als doorsturen faalde
- `user_agent`, `ip` (text, nullable) — voor spam-debug

RLS:
- INSERT toegestaan voor `anon` + `authenticated` (publiek formulier).
- SELECT/UPDATE/DELETE alleen voor admin (`has_role(auth.uid(),'admin')`).
- GRANTs conform projectstandaard.

### 2. Server function (`src/lib/contact.functions.ts`)
`submitContact` — `createServerFn` POST:
- Zod-validatie: voornaam/achternaam 1–100, email geldig ≤255, bericht 1–4000, telefoon optioneel ≤50, consent verplicht `true`.
- Insert via `supabaseAdmin` in `contact_submissions` (bypass RLS, controle staat in validatie).
- `fetch(N8N_WEBHOOK_URL, { method: 'POST', body: JSON.stringify({...velden, submission_id, created_at}) })` met 10s timeout.
- Op succes → update rij `forwarded_to_n8n = true`. Bij fout → `n8n_error` invullen, maar **geen** error naar de gebruiker (data is veilig opgeslagen).
- Retour: `{ ok: true }`.

### 3. Formulier (`src/routes/contact.tsx`)
- `useServerFn(submitContact)` aanroepen in `onSubmit`.
- Loading-state op de submit-knop ("Verzenden…").
- Bij succes huidige `is-sent` bevestiging tonen; bij netwerkfout een nette foutmelding boven het formulier.

## Beveiliging webhook
De n8n-URL bevat al een UUID-token (publiek, maar onraadbaar). Geen extra secret-header toegevoegd — kan later eenvoudig met een `CONTACT_WEBHOOK_SECRET` in Lovable Cloud + verify-node in n8n.

## Niet in scope
- Admin-overzichtspagina van inzendingen (kan in een volgende stap).
- Bevestigingsmail naar de inzender (gebruikt e-maildomein; aparte vervolgvraag).
