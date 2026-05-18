import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { getHomeSections } from "@/lib/home.functions";

export const Route = createFileRoute("/")({
  loader: () => getHomeSections(),
  head: () => ({
    meta: [
      { title: "Koninklijk Fanfarekorps Wilhelmina — Heerde" },
      { name: "description", content: "Sinds 1898 het muzikale hart van Heerde. Drie orkesten, ruim tachtig musici, één traditie." },
      { property: "og:title", content: "Koninklijk Fanfarekorps Wilhelmina — Heerde" },
      { property: "og:description", content: "Sinds 1898 het muzikale hart van Heerde. Drie orkesten, ruim tachtig musici, één traditie." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "icon", href: "/assets/wilhelmina-mark-gold.svg" }],
  }),
  component: HomePage,
});

const arrow = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
);

const upcoming = [
  { date: "za 14 mrt 2026 · 20:00", title: "Voorjaarsconcert — Holst & Sparke", dek: "Wilhelmina opent het seizoen met werk van Gustav Holst, Philip Sparke en een nieuwe compositie van huiscomponist Anouk Veldman in de Dorpskerk.", ph: "ph--strings" },
  { date: "zo 19 apr 2026 · 15:00", title: "Veldman: Verstilling — wereldpremière", dek: "Dirigent Anouk Veldman leidt de wereldpremière van haar eigen compositie voor fanfareorkest en solo trompet, geschreven voor Wilhelmina.", ph: "ph--portrait-warm" },
  { date: "vr 24 apr 2026 · 20:30", title: "Slagwerkgroep — Resonance II", dek: "De Wilhelmina-slagwerkgroep speelt nieuw werk van Reich, Veldman en jonge Nederlandse componisten in De Vlasakkers.", ph: "ph--brass" },
];

const stories = [
  { eyebrow: "Interview", title: "Anouk Veldman: 'Een fanfare kan fluisteren'", dek: "In haar derde seizoen als chef-dirigent zoekt Anouk Veldman naar ingetogenheid binnen een traditie van groot blazersgeluid.", ph: "ph--portrait-warm", slug: "anouk-veldman-fanfare-fluisteren" },
  { eyebrow: "Achtergrond", title: "Hoe het leerlingenorkest een nieuwe generatie vormt", dek: "Achttien jonge musici, één dirigent en de luxe om wekelijks te repeteren met gepokte en gemazelde fanfaremusici.", ph: "ph--portrait-cool", slug: "leerlingenorkest-nieuwe-generatie" },
  { eyebrow: "Achtergrond", title: "125 jaar later, terug naar de Markt", dek: "Wilhelmina speelde haar eerste noten in 1898 op de Markt in Heerde. Op Koningsdag 2026 keert het orkest naar die plek terug.", ph: "ph--score", slug: "terug-naar-de-markt" },
];

function HomePage() {
  const { hero, banner } = Route.useLoaderData();
  return (
    <SiteLayout overDark>
      {/* HERO */}
      <section className="w-hero">
        <div className="w-hero__bg" aria-hidden="true" />
        <div className="w-hero__photo" aria-hidden="true" />
        <div className="w-hero__scrim" aria-hidden="true" />
        <div className="w-hero__diamonds" aria-hidden="true"><i /><i /><i /><i /></div>

        <div className="w-hero__content is-in">
          {hero.eyebrow && <p className="w-hero__eyebrow">{hero.eyebrow}</p>}
          <h1 className="w-hero__title">
            {hero.title}
            {hero.subtitle && <em>{hero.subtitle}</em>}
          </h1>
          {hero.text && <p className="w-hero__lead">{hero.text}</p>}
          <div className="w-hero__ctas">
            {hero.primary_label && (
              <Link className="w-btn w-btn--primary" to={hero.primary_href || "/"}>
                {hero.primary_label} {arrow}
              </Link>
            )}
            {hero.secondary_label && (
              <Link className="w-btn w-btn--ghost-light" to={hero.secondary_href || "/"}>
                {hero.secondary_label}
              </Link>
            )}
          </div>
        </div>
        <div className="w-hero__scroll" aria-hidden="true">Scroll</div>
      </section>

      {/* BINNENKORT */}
      <section className="w-section" id="agenda">
        <div className="w-container">
          <header className="w-section__head">
            <div>
              <p className="w-eyebrow">Agenda</p>
              <h2 className="w-section__title" style={{ marginTop: 14 }}>Binnenkort</h2>
            </div>
            <Link className="w-link-arrow" to="/optredens">
              <span className="w-link-arrow__bar" />
              Al onze optredens
            </Link>
          </header>

          <div className="w-row">
            <div className="w-row__grid">
              {upcoming.map((c) => (
                <Link key={c.title} className="w-card" to="/optredens">
                  <div className="w-card__media">
                    <span className={`ph ${c.ph}`} aria-hidden="true" />
                  </div>
                  <div className="w-card__body">
                    <p className="w-card__date">{c.date}</p>
                    <h3 className="w-card__title">{c.title}</h3>
                    <p className="w-card__dek">{c.dek}</p>
                    <span className="w-card__cta">Kaarten &amp; info {arrow}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* PROMO / BANNER */}
          <div className="w-promo">
            <div className="w-promo__copy">
              <div className="w-promo__dots" aria-hidden="true"><i /><i /><i /></div>
              <div>
                <h3 className="w-promo__title">{banner.title}</h3>
                {banner.text && <p className="w-promo__dek">{banner.text}</p>}
              </div>
              {banner.button_label && (
                <Link className="w-btn w-btn--primary w-promo__cta" to={banner.button_href || "/"}>
                  {banner.button_label} {arrow}
                </Link>
              )}
            </div>
            <div className="w-promo__media" aria-hidden="true">
              <span className="ph ph--rehearsal" style={{ position: "absolute", inset: 0 }} />
            </div>
          </div>
        </div>
      </section>

      {/* ACTUEEL */}
      <section className="w-section w-section--sand" id="nieuws">
        <div className="w-container">
          <header className="w-section__head">
            <div>
              <p className="w-eyebrow">Nieuws</p>
              <h2 className="w-section__title" style={{ marginTop: 14 }}>Actueel</h2>
            </div>
            <Link className="w-link-arrow" to="/nieuws">
              <span className="w-link-arrow__bar" />
              Bekijk alles
            </Link>
          </header>

          <div className="w-row">
            <div className="w-row__grid">
              {stories.map((s) => (
                <Link key={s.title} className="w-card" to="/nieuws/$slug" params={{ slug: s.slug }}>
                  <div className="w-edcard__media">
                    <span className={`ph ${s.ph}`} aria-hidden="true" />
                  </div>
                  <div className="w-card__body">
                    <p className="w-edcard__eyebrow">{s.eyebrow}</p>
                    <h3 className="w-card__title">{s.title}</h3>
                    <p className="w-card__dek">{s.dek}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ONTDEK fullbleed */}
      <section className="w-fullbleed" id="orkesten">
        <div className="w-fullbleed__photo" aria-hidden="true" />
        <div className="w-fullbleed__scrim" aria-hidden="true" />
        <svg className="w-fullbleed__mark" viewBox="490 20 360 320" aria-hidden="true">
          <path fill="#9B804A" d="M797.07,24.11c-25.22-2.72-46.95,6.93-48.53,21.55c-1.58,14.62,17.59,28.69,42.81,31.41 c6.95,0.75,13.61,0.53,19.68-0.44v153.3l-113.83,16.16V75.31c1.58-14.62-17.59-28.69-42.81-31.41 c-25.22-2.72-46.95,6.93-48.53,21.55c-1.58,14.62,17.59,28.69,42.81,31.41c6.95,0.75,13.61,0.53,19.68-0.44v153.76l-112.71,16 V96.46c1.58-14.62-17.59-28.69-42.81-31.41c-25.22-2.72-46.95,6.93-48.53,21.55c-1.58,14.62,17.59,28.69,42.81,31.41c6.95,0.75,13.61,0.53,19.68-0.44v152.71v38.84v40.71l313.08-40.71v-40.94v-42.35V55.52C841.46,40.89,822.29,26.83,797.07,24.11z" />
        </svg>
        <div className="w-fullbleed__inner">
          <p className="w-fullbleed__eyebrow">— Ontdek</p>
          <h2 className="w-fullbleed__title">Drie orkesten,<br />één traditie.</h2>
          <p className="w-fullbleed__dek">
            Wilhelmina in verhalen, beelden en muziek — van het fanfareorkest op het Wereld Muziek Concours tot de eerste repetitie van het leerlingenorkest.
          </p>
          <Link className="w-link-arrow w-link-arrow--light" to="/orkesten">
            <span className="w-link-arrow__bar" />
            Lees meer
          </Link>
        </div>
      </section>

      {/* STEUN + LEERLINGENORKEST */}
      <section className="w-section" id="steun">
        <div className="w-container">
          <div className="w-promo-pair">
            <Link className="w-promo2" to="/steun">
              <div className="w-promo2__photo ph--strings" aria-hidden="true" />
              <div className="w-promo2__scrim" aria-hidden="true" />
              <div className="w-promo2__inner">
                <h3 className="w-promo2__title">Steun Wilhelmina</h3>
                <p className="w-promo2__dek">
                  Word vriend van de vereniging en draag bij aan de toekomst van de fanfaretraditie in Heerde — sinds 1898.
                </p>
                <span className="w-promo2__cta">Word vriend {arrow}</span>
              </div>
            </Link>
            <Link className="w-promo2" to="/orkesten">
              <div className="w-promo2__photo w-promo2__photo--alt" aria-hidden="true" />
              <div className="w-promo2__scrim" aria-hidden="true" />
              <div className="w-promo2__inner">
                <h3 className="w-promo2__title">Leerlingenorkest</h3>
                <p className="w-promo2__dek">
                  Een vrijplaats voor jonge musici tussen 8 en 18 jaar uit Heerde en omgeving — wekelijks repetitie, jaarlijks twee concerten.
                </p>
                <span className="w-promo2__cta">Meedoen {arrow}</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="w-news">
        <div className="w-container">
          <div className="w-news__inner">
            <div>
              <p className="w-eyebrow">Nieuwsbrief</p>
              <h2 className="w-news__title" style={{ marginTop: 14 }}>Schrijf u in voor onze nieuwsbrief</h2>
              <p className="w-news__dek">
                Blijf op de hoogte van actuele informatie over onze concerten, musici en achtergrondverhalen — circa zes uitgaven per jaar.
              </p>
            </div>
            <NewsletterForm />
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
