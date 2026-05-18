import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { NewsletterBand } from "@/components/site/NewsletterBand";

export const Route = createFileRoute("/nieuws/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replaceAll("-", " ")} — Wilhelmina Heerde` },
    ],
  }),
  component: NieuwsDetail,
});

function NieuwsDetail() {
  return (
    <SiteLayout>
      <article className="w-article">
        <div className="w-article__container">
          <Link className="w-article__back" to="/nieuws">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
            Nieuws
          </Link>

          <header className="w-article__head">
            <p className="w-article__eyebrow">Interview · Achtergrond</p>
            <h1 className="w-article__title">
              Anouk Veldman: <em>'Een fanfare kan fluisteren'</em>
            </h1>
            <p className="w-article__date">do 12 februari 2026</p>
            <p className="w-article__lead">
              In haar derde seizoen als chef-dirigent zoekt Anouk Veldman naar ingetogenheid binnen een traditie van groot blazersgeluid. Op{" "}
              <Link className="w-link-ext" to="/optredens">19 april</Link> dirigeert ze de wereldpremière van haar eigen werk <em>Verstilling</em>, geschreven voor Wilhelmina.
              'Het gaat om de stilte tussen de noten — daar wordt een fanfare opeens kwetsbaar.'
            </p>
          </header>

          <figure className="w-article__hero">
            <div className="w-article__hero-media">
              <span className="ph ph--portrait-warm ph--no-mark" aria-hidden="true" />
            </div>
          </figure>
          <p className="w-article__caption">(foto: Annaleen Louwes — Repetitie Dorpskerk, januari 2026)</p>

          <p className="w-article__byline">
            <strong>Door Frederike Berntsen</strong> · dit artikel verscheen in <a className="w-link-ext" href="#">Crescendo</a>, het jaarboek van Wilhelmina, editie 2025/2026.
          </p>

          <div className="w-article__body">
            <p>
              Ze zoomt in vanuit een vroege ochtend in Heerde, even na de eerste repetitie van de week. Helemaal als het over haar nieuwe compositie <em>Verstilling</em> gaat, dat eind april in wereldpremière gaat met Wilhelmina onder haar eigen leiding, juicht Anouk Veldman op. 'Een fanfare moet je op topniveau willen uitvoeren — niet omdat het zo hoort, maar omdat de muziek erom vraagt.'
            </p>
            <p>
              Toen Veldman drie jaar geleden voor het eerst voor Wilhelmina stond, kreeg ze 'een vriendelijke ontvangst'. Vijfentachtig musici, een traditie van meer dan honderd jaar, een dorp dat haar concert-agenda kent zoals andere dorpen de wedstrijdagenda van de plaatselijke voetbalclub.
            </p>
            <div className="w-article__quote">
              <p>Ik ben op een punt beland waarop ik geen compromissen meer wil sluiten.</p>
              <cite>— Anouk Veldman</cite>
            </div>
            <p>
              Veldman vervolgt: 'Ik denk dat ik eerlijk ben in mijn spel.' Eerlijk naar de muziek, naar de musici, en naar zichzelf. 'Als je met iemand praat, en je kijkt iemand in de ogen, dan weet je het. En dat is op een podium niet anders.'
            </p>
            <hr className="w-article__rule" />
            <p>
              Veldman programmeert in mei een Pinksterconcert met Mahlers <em>Adagietto</em> uit de Vijfde, in haar eigen arrangement voor fanfareorkest en kamerkoor. 'Iedereen kent dat stuk van de strijkers. Maar leg het in handen van een fanfareorkest en je hoort iets nieuws.'
            </p>
            <div className="w-article__quote">
              <p>De klank van Wilhelmina heeft iets zonnigs en lichts.</p>
              <cite>— Anouk Veldman</cite>
            </div>
            <p>
              Veldman tekende eind 2025 bij voor nog drie seizoenen. 'Door het besluit om eerlijk te zijn, ben ik ook meer ontspannen op het podium. Dat unieke moment vinden tijdens een concert — daarom doe je dit.'
            </p>
          </div>
        </div>
      </article>

      <section className="w-context">
        <div className="w-context__inner">
          <div>
            <p className="w-context__eyebrow">Beluister</p>
            <h2 className="w-context__title">Wilhelmina speelt Veldman</h2>
            <p className="w-context__dek">
              Een afspeellijst met werk van Anouk Veldman, gespeeld door Wilhelmina — van studio-opnames tot live-opnames van het Pinksterconcert.
            </p>
            <a className="w-btn w-btn--ghost-light" href="#">
              Open in Spotify
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </a>
          </div>
          <div className="w-context__media">
            <span className="ph ph--brass ph--no-mark" aria-hidden="true" />
          </div>
        </div>
      </section>

      <NewsletterBand />
    </SiteLayout>
  );
}
