# Koninklijk Fanfarekorps Wilhelmina

We gaan een nieuwe website bouwen voor Wilhelmi naar Heeren. Dit is een muziekvereniging.

We hebben daarvoor een design gemaakt dat we moeten omzetten naar een nieuwe website. Let hierbij op dat we een manageable website willen maken.

Dus we willen content gaan opslaan in een superbase database. We willen toegang geven voor een admin en voor een contentbeheerder. Dat moet beheersbaar zijn.

De designs en het design system die ik heb bijgevoegd, zorgen ervoor dat zoveel mogelijk herbruikbare blokken worden gebruikt voor bijvoorbeeld de nieuwsbrieven, maar ook voor de header en de footer, et cetera. 

maak je plan om de website te bouwen.
laat weten als je meer informatie nodig hebt

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://wilhelmina-heerde.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9dced5fa-0dbf-4d68-b917-0e6025b887df).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## External Cloudflare hosting

The public homepage, agenda, menu, sponsors and sitemap use the public database key and respect existing row-level security. They do not need a service-role key.

Configure the public connection values in two places in Cloudflare:

| Where | Variables |
| --- | --- |
| Workers Builds settings (available during `bun run build`) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` |
| Worker Settings → Variables and Secrets (runtime) | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` |

Use the same public URL and public key for both pairs. Redeploy after changing build variables. Keep runtime variables available to `process.env` with the configured `nodejs_compat` flag. Do not put private keys in `VITE_*` variables.

**Not yet portable:** contact submission, newsletter/Brevo synchronization, privileged administration, analytics and 404 logging still rely on the managed server environment. The Lovable Cloud service-role key is not exportable. These operations need a separate secure hosted processing endpoint before switching the production domain; do not weaken database policies or replace the admin client with a public client for private operations.

Deployment check: verify `/`, `/optredens`, `/sponsoren`, a published `/p/...` page and `/sitemap.xml` on the Worker URL before moving the domain. Do not infer that forms or administration work from a successful homepage check.
