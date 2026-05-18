import { Link } from "@tanstack/react-router";

const crestPath =
  "M797.07,24.11c-25.22-2.72-46.95,6.93-48.53,21.55c-1.58,14.62,17.59,28.69,42.81,31.41 c6.95,0.75,13.61,0.53,19.68-0.44v153.3l-113.83,16.16V75.31c1.58-14.62-17.59-28.69-42.81-31.41 c-25.22-2.72-46.95,6.93-48.53,21.55c-1.58,14.62,17.59,28.69,42.81,31.41c6.95,0.75,13.61,0.53,19.68-0.44v153.76l-112.71,16 V96.46c1.58-14.62-17.59-28.69-42.81-31.41c-25.22-2.72-46.95,6.93-48.53,21.55c-1.58,14.62,17.59,28.69,42.81,31.41c6.95,0.75,13.61,0.53,19.68-0.44v152.71v38.84v40.71l313.08-40.71v-40.94v-42.35V55.52C841.46,40.89,822.29,26.83,797.07,24.11z";

type Sponsor = { name: string; website_url?: string | null };

type Props = {
  sponsors?: Sponsor[];
};

export function SiteFooter({ sponsors }: Props) {
  const list = sponsors && sponsors.length > 0
    ? sponsors
    : [
        { name: "Rabobank IJsseldelta" },
        { name: "Gemeente Heerde" },
        { name: "Prins Bernhard Cultuurfonds" },
        { name: "Stichting Heerder Erf" },
      ];

  return (
    <footer className="w-footer">
      <div className="w-container">
        <div className="w-footer__grid">
          <div className="w-footer__brand">
            <div className="w-footer__crest" aria-hidden="true">
              <svg viewBox="490 20 360 320">
                <path fill="currentColor" d={crestPath} />
              </svg>
            </div>
            <p className="w-footer__wordmark">
              KONINKLIJK FANFAREKORPS<br />
              WILHELMINA — HEERDE
            </p>
          </div>

          <ul className="w-footer__col">
            <li><Link to="/over">Organisatie</Link></li>
            <li><Link to="/over">Bestuur</Link></li>
            <li><Link to="/over">Vacatures</Link></li>
            <li><Link to="/contact">Veelgestelde vragen</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>

          <ul className="w-footer__col">
            <li><a href="#">Pers</a></li>
            <li><a href="#">Beeldmateriaal</a></li>
            <li><a href="#">Programmaboeken</a></li>
            <li><a href="#">Verhuur</a></li>
            <li><a href="#">Repetitielocaties</a></li>
          </ul>

          <ul className="w-footer__col">
            <li><a href="#"><Icon name="fb" /> Facebook</a></li>
            <li><a href="#"><Icon name="ig" /> Instagram</a></li>
            <li><a href="#"><Icon name="yt" /> YouTube</a></li>
            <li><a href="#"><Icon name="sp" /> Spotify</a></li>
            <li><a href="#"><Icon name="mail" /> Nieuwsbrief</a></li>
          </ul>
        </div>

        <div className="w-footer__patron">
          <strong>Beschermheer</strong>
          Burgemeester van Heerde — sinds 1923 verbonden aan de vereniging
        </div>

        <div className="w-footer__sponsors">
          <span className="w-footer__sponsors-label">Hoofdsponsors seizoen 2026</span>
          <div className="w-footer__sponsors-row">
            {list.map((s, i) => (
              <span key={s.name + i} style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
                {s.website_url ? (
                  <a href={s.website_url} target="_blank" rel="noopener noreferrer">{s.name}</a>
                ) : (
                  <span>{s.name}</span>
                )}
                {i < list.length - 1 && <em aria-hidden="true">·</em>}
              </span>
            ))}
          </div>
        </div>

        <div className="w-footer__base">
          <span>© {new Date().getFullYear()} Koninklijk Fanfarekorps Wilhelmina, Heerde</span>
          <span className="w-footer__base-links">
            <a href="#">Privacy</a>
            <span aria-hidden="true">·</span>
            <a href="#">Algemene voorwaarden</a>
            <span aria-hidden="true">·</span>
            <a href="#">Cookies</a>
          </span>
        </div>
      </div>
    </footer>
  );
}

function Icon({ name }: { name: "fb" | "ig" | "yt" | "sp" | "mail" }) {
  const common = {
    width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
    strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "fb": return <svg {...common}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>;
    case "ig": return <svg {...common}><rect width="20" height="20" x="2" y="2" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>;
    case "yt": return <svg {...common}><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>;
    case "sp": return <svg {...common}><circle cx="12" cy="12" r="10" /><path d="M8 11.5a8 8 0 0 1 9-1" /><path d="M7 14.5a6 6 0 0 1 7-1" /><path d="M8 17a4 4 0 0 1 5 0" /></svg>;
    case "mail": return <svg {...common}><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>;
  }
}
