import { Link } from "@tanstack/react-router";
import noirLogo from "@/assets/wilhelmina-noir.svg";

type Sponsor = { name: string; website_url?: string | null };

type Props = {
  sponsors?: Sponsor[];
};

export function SiteFooter(_props: Props) {

  return (
    <footer className="w-footer">
      <div className="w-container">
        <div className="w-footer__grid">
          <div className="w-footer__brand">
            <img src={noirLogo} alt="Koninklijk Fanfarekorps Wilhelmina Heerde" className="w-footer__logo" />
          </div>

          <ul className="w-footer__col">
            <li><Link to="/p/$slug" params={{ slug: "a-orkest" }}>Orkest</Link></li>
            <li><Link to="/p/$slug" params={{ slug: "bestuur" }}>Bestuur</Link></li>
            <li><Link to="/p/$slug" params={{ slug: "oud-papier-inzameling" }}>Oud papier</Link></li>
            <li><Link to="/contact">Veelgestelde vragen</Link></li>
            <li><Link to="/p/$slug" params={{ slug: "contact" }}>Contact</Link></li>
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
