import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { NewsletterBand } from "@/components/site/NewsletterBand";

export const Route = createFileRoute("/optredens")({
  head: () => ({
    meta: [
      { title: "Agenda — Wilhelmina Heerde" },
      { name: "description", content: "Het hele jaar fanfaremuziek op het hoogste niveau — concerten, premières en ceremoniële optredens van Wilhelmina." },
      { property: "og:title", content: "Agenda — Wilhelmina Heerde" },
      { property: "og:description", content: "Concerten, premières en ceremoniële optredens van Wilhelmina, het slagwerkensemble en het leerlingenorkest." },
    ],
  }),
  component: OptredensPage,
});

const arrow = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
);

type Row = { day: string; num: string; ph: string; time: string; kind: string; loc: string; title: string; dek: React.ReactNode; price: string; primary?: string; secondary?: string };

const groups: { month: string; count: string; rows: Row[] }[] = [
  {
    month: "Maart 2026", count: "twee concerten", rows: [
      { day: "Za", num: "14", ph: "ph--strings", time: "20:00", kind: "Concert", loc: "Dorpskerk, Heerde", title: "Voorjaarsconcert — Holst & Sparke", dek: <>Wilhelmina opent het seizoen met Holst' <em>First Suite in E♭</em>, Sparke's <em>Dance Movements</em> en de wereldpremière van Anouk Veldmans <em>Verstilling</em>.</>, price: "Vanaf € 22 · vrienden € 18" },
      { day: "Wo", num: "25", ph: "ph--score", time: "19:30", kind: "Educatie", loc: "Cultuurhuis, Wapenveld", title: "Open repetitie leerlingenorkest", dek: <>Achttien jonge musici onder leiding van assistent-dirigent Jasper de Vries werken aan het voorjaarsprogramma. Vrij toegankelijk, met napraat en koffie.</>, price: "Toegang vrij · aanmelden gewenst", secondary: "Reserveer plek" },
    ],
  },
  {
    month: "April 2026", count: "twee concerten", rows: [
      { day: "Zo", num: "19", ph: "ph--portrait-warm", time: "15:00", kind: "Première", loc: "Cultuurhuis, Wapenveld", title: "Veldman: Verstilling — wereldpremière", dek: <>Anouk Veldman leidt de wereldpremière van haar eigen werk voor fanfareorkest en solo trompet, geschreven voor Wilhelmina.</>, price: "Vanaf € 26 · met inleiding 14:15" },
      { day: "Vr", num: "24", ph: "ph--brass", time: "20:30", kind: "Slagwerk", loc: "De Vlasakkers, Heerde", title: "Slagwerkgroep — Resonance II", dek: <>De Wilhelmina-slagwerkgroep speelt nieuw werk van Steve Reich, Anouk Veldman en drie jonge Nederlandse componisten in een geënsceneerde voorstelling met licht en beeld.</>, price: "Vanaf € 19 · staanplaats vrij" },
    ],
  },
  {
    month: "Mei 2026", count: "twee concerten", rows: [
      { day: "Ma", num: "04", ph: "ph--dark", time: "19:45", kind: "Ceremonie", loc: "Markt, Heerde", title: "Dodenherdenking — Wilhelmina aan het monument", dek: <>Ceremoniële begeleiding van de jaarlijkse herdenking op de Markt. Stille tocht vanaf de Dorpskerk om 19:30, gevolgd door <em>Last Post</em>, twee minuten stilte en het Wilhelmus.</>, price: "Vrij toegankelijk", primary: "Programma & route", secondary: "Voeg toe aan agenda" },
      { day: "Za", num: "23", ph: "ph--hall", time: "20:00", kind: "Concert", loc: "Dorpskerk, Heerde", title: "Pinksterprogramma — Mahler & Bernstein", dek: <>Mahlers <em>Adagietto</em> uit de Vijfde, gearrangeerd voor fanfareorkest door Anouk Veldman, naast Bernsteins <em>Chichester Psalms</em> in samenwerking met Kamerkoor Heerde.</>, price: "Vanaf € 28 · met koor" },
    ],
  },
];

function OptredensPage() {
  return (
    <SiteLayout>
      <section className="w-pgheader">
        <div className="w-container">
          <h1 className="w-pgheader__title">Agenda</h1>
          <p className="w-pgheader__sub">
            Het hele jaar fanfaremuziek op het hoogste niveau — concerten, premières en ceremoniële optredens van Wilhelmina, slagwerkensemble en leerlingenorkest.
          </p>

          <div className="w-filters" role="search">
            <label className="w-filters__search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
              <input type="search" placeholder="Zoek op trefwoord, componist of werk" aria-label="Zoek" />
            </label>
            {["Datum", "Dirigent", "Componist", "Locatie", "Soort concert"].map((label) => (
              <label key={label} className="w-filters__select">
                <span>{label}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                <select aria-label={label}>
                  <option>Alle {label.toLowerCase()}</option>
                </select>
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="w-agenda">
        <div className="w-container">
          {groups.map((g) => (
            <div className="w-agenda__group" key={g.month}>
              <h2 className="w-agenda__month">{g.month} <em>{g.count}</em></h2>
              <ul className="w-agenda__list">
                {g.rows.map((r) => (
                  <li key={r.title} className="w-agenda__row">
                    <div className="w-agenda__date">
                      <span className="w-agenda__date-day">{r.day}</span>
                      <span className="w-agenda__date-num">{r.num}</span>
                    </div>
                    <div className="w-agenda__thumb">
                      <span className={`ph ${r.ph}`} aria-hidden="true" />
                    </div>
                    <div className="w-agenda__body">
                      <p className="w-agenda__meta">
                        <span>{r.time}</span>
                        <span className="w-agenda__meta-dot" aria-hidden="true" />
                        <span>{r.kind}</span>
                        <span className="w-agenda__meta-dot" aria-hidden="true" />
                        <span>{r.loc}</span>
                      </p>
                      <h3 className="w-agenda__title">{r.title}</h3>
                      <p className="w-agenda__dek">{r.dek}</p>
                      <p className="w-agenda__price">{r.price}</p>
                    </div>
                    <div className="w-agenda__actions">
                      <Link className="w-btn w-btn--primary" to="/contact">{r.primary ?? "Kaarten & info"} {arrow}</Link>
                      <Link className="w-btn w-btn--secondary" to="/contact">{r.secondary ?? "Bestel direct"} {arrow}</Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <NewsletterBand />
    </SiteLayout>
  );
}
