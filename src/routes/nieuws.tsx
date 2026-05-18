import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { NewsletterBand } from "@/components/site/NewsletterBand";

export const Route = createFileRoute("/nieuws")({
  head: () => ({
    meta: [
      { title: "Nieuws — Wilhelmina Heerde" },
      { name: "description", content: "Interviews, achtergronden en aankondigingen van Koninklijk Fanfarekorps Wilhelmina." },
      { property: "og:title", content: "Nieuws — Wilhelmina Heerde" },
      { property: "og:description", content: "Interviews, achtergronden en aankondigingen." },
    ],
  }),
  component: NieuwsPage,
});

type Item = { slug: string; eyebrow: string; title: React.ReactNode; dek: React.ReactNode; ph: string };
const items: Item[] = [
  { slug: "anouk-veldman-fanfare-fluisteren", eyebrow: "Interview", title: "Anouk Veldman: 'Een fanfare kan fluisteren'", dek: "In haar derde seizoen als chef-dirigent zoekt Anouk Veldman naar ingetogenheid binnen een traditie van groot blazersgeluid. 'Het gaat om de stilte tussen de noten.'", ph: "ph--portrait-warm" },
  { slug: "nieuw-seizoen-2627", eyebrow: "Achtergrond", title: "Een nieuw seizoen: variatie en verbeeldingskracht", dek: "Wilhelmina presenteerde afgelopen zaterdag het seizoen 2026/2027, met onder meer een dubbelconcert met het Heerder Mannenkoor en een première van Hardy Mertens.", ph: "ph--hall" },
  { slug: "stepan-armasar-solotrompet", eyebrow: "Onze musici", title: "Stepan Armasar wordt nieuwe solotrompet", dek: "Met veel plezier kondigen we Stepan Armasar aan als solotrompettist van Wilhelmina. De Moldavisch-Nederlandse musicus debuteert tijdens het Voorjaarsconcert.", ph: "ph--portrait-cool" },
  { slug: "seizoensopening-dorpskerk", eyebrow: "Concerten", title: "Een feestelijke seizoensopening in de Dorpskerk", dek: "Hoogtepunten van het openingsconcert, met Holst, Sparke en de eerste presentatie van het opleidingsorkest in een gezamenlijk stuk.", ph: "ph--rehearsal" },
  { slug: "veldman-residentie", eyebrow: "Achtergrond", title: "Start residentie Veldman: drie jaar nieuwe stukken", dek: <>Met de uitvoering van <em>Verstilling</em> op 19 april trapt Wilhelmina de driejarige componistenresidentie van Anouk Veldman af.</>, ph: "ph--score" },
  { slug: "jeroen-berwaerts", eyebrow: "Interview", title: "Muzikale reis met Jeroen Berwaerts", dek: "De Belgische trompettist en dirigent is een ster in de blazerswereld. Voor zijn debuut bij Wilhelmina stelde hij een eigenzinnig programma samen rond Berio en Britten.", ph: "ph--portrait-warm" },
  { slug: "wereldpremiere-onrust", eyebrow: "Achtergrond", title: "Mystieke wereldpremière in de Dorpskerk", dek: <>Wilhelmina brengt een bijzondere wereldpremière: <em>Onrust</em> van componist Rob Zuidam, met teksten van de middeleeuwse mystica Hadewijch.</>, ph: "ph--brass" },
  { slug: "hardy-mertens-negende", eyebrow: "Achtergrond", title: "Hardy Mertens over de heruitgave van zijn Negende", dek: "Waarom is de Negende symfonie voor fanfare van Hardy Mertens zo bijzonder, en wat verandert er in de nieuwe editie die Wilhelmina speelt?", ph: "ph--portrait-cool" },
  { slug: "klaus-makela-matthaus", eyebrow: "Interview", title: "Klaus Mäkelä over de Matthäus Passion", dek: "Een bijzondere primeur: Klaus Mäkelä leidt Bachs Matthäus-Passion samen met Wilhelmina en het Heerder Bachkoor.", ph: "ph--hall" },
];

function NieuwsPage() {
  return (
    <SiteLayout>
      <section className="w-archive-hero">
        <div className="w-archive-hero__photo" aria-hidden="true" />
        <div className="w-archive-hero__scrim" aria-hidden="true" />
        <div className="w-archive-hero__inner">
          <p className="w-archive-hero__eyebrow">Achter de partituur</p>
          <h1 className="w-archive-hero__title">Nieuws</h1>
        </div>
      </section>

      <div className="w-archive-filters" role="search">
        <div className="w-archive-filters__inner">
          <label className="w-archive-filters__search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
            <input type="search" placeholder="Zoek op sleutelwoord, dirigent of componist" aria-label="Zoek" />
          </label>
          <label className="w-archive-filters__select">
            <span>Categorie</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            <select aria-label="Categorie"><option>Alle categorieën</option></select>
          </label>
          <label className="w-archive-filters__select">
            <span>Seizoen</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            <select aria-label="Seizoen"><option>Alle seizoenen</option></select>
          </label>
          <div className="w-archive-filters__sort" aria-label="Sortering">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M7 12h10" /><path d="M10 18h4" /></svg>
            Nieuwste eerst
          </div>
        </div>
      </div>

      <section className="w-archive">
        <div className="w-container">
          <div className="w-archive__grid">
            {items.map((i) => (
              <Link key={i.slug} className="w-acard" to="/nieuws/$slug" params={{ slug: i.slug }}>
                <div className="w-acard__media"><span className={`ph ${i.ph}`} aria-hidden="true" /></div>
                <p className="w-acard__eyebrow">{i.eyebrow}</p>
                <h3 className="w-acard__title">{i.title}</h3>
                <p className="w-acard__dek">{i.dek}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <NewsletterBand />
    </SiteLayout>
  );
}
