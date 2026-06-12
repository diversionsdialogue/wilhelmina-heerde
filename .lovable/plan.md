## Doel
Het nieuwsbriefformulier ("Schrijf je in voor onze nieuwsbrief") koppelen aan Brevo (lijst-ID **3**), met single opt-in en een eigen logboek in de database.

## Stappen

1. **Brevo koppelen** via de Lovable connector-popup (`standard_connectors--connect` met `brevo`). Jij selecteert/maakt de connectie in een veilig venster — daar plak je de API-key. Er wordt automatisch een `BREVO_API_KEY` secret aangemaakt; geen handmatig kopiëren nodig.

2. **Database — nieuwe tabel** `newsletter_subscribers`:
   - velden: `email`, `source` (bijv. "homepage"), `brevo_synced` (bool), `brevo_error` (text), `user_agent`, `ip`
   - RLS: `anon`/`authenticated` mogen INSERT; alleen admins mogen SELECT/UPDATE/DELETE
   - `service_role` ALL
   - unieke index op `lower(email)` zodat dubbele aanmeldingen netjes geüpdatet worden

3. **Server function** `src/lib/newsletter.functions.ts` → `subscribeNewsletter`:
   - Zod-validatie (geldig e-mailadres, ≤255)
   - Insert/upsert in `newsletter_subscribers` via `supabaseAdmin`
   - `POST https://connector-gateway.lovable.dev/brevo/contacts` met `{ email, listIds: [3], updateEnabled: true }`, headers `Authorization: Bearer LOVABLE_API_KEY` + `X-Connection-Api-Key: BREVO_API_KEY`
   - Bij succes: `brevo_synced = true`. Bij fout: `brevo_error` invullen maar gebruiker toch een vriendelijke melding tonen (lead is bewaard).
   - 10s timeout, foutafhandeling per HTTP-status

4. **`NewsletterForm` component** koppelen aan de server function via `useServerFn`:
   - states: `submitting`, `sent`, `errorMsg`
   - knop disable tijdens submit, succesmelding tonen
   - hydration-mismatch (LastPass-icon) oplossen met `suppressHydrationWarning` op het juiste niveau / e-mail input `autoComplete="email"` + form `noValidate`

5. **Admin Mailbox** — bestaande sectie "E-mailabonnees" vullen:
   - `listNewsletterSubscribers` server function (paginering 10/p, admin-only via `is_content_editor`)
   - tabel met e-mail, datum, Brevo-status (badge OK/Fout/—), bron
   - foutmelding tonen bij hover/uitklap

## Technisch
- Geen edge function nodig — alles via `createServerFn`.
- Brevo-aanroep gaat door de Lovable connector-gateway, dus de API-key blijft server-side versleuteld; je hoeft hem nergens in code te zetten.
- Lijst-ID `3` zet ik als constante bovenin de server function, makkelijk aan te passen.

## Wat ik van je nodig heb
Niets meer in chat — zodra je op "Implement plan" klikt, opent er straks een popup waar je de Brevo-connectie kiest of de API-key plakt. Daarna draait de rest automatisch.