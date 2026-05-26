import { Link } from "@tanstack/react-router";
import logoWhite from "@/assets/wilhelmina-logo-gold.svg";

type Props = {
  overDark?: boolean;
  onOpenMenu?: () => void;
};

export function SiteHeader({ onOpenMenu }: Props) {
  return (
    <header className="w-header w-header--black" id="site-header">
      <div className="w-header__inner">
        <Link className="w-header__brand" to="/" aria-label="Wilhelmina — home">
          <img src={logoWhite} alt="Koninklijk Fanfarekorps Wilhelmina Heerde" className="w-header__logo" />
        </Link>

        <div className="w-header__actions">
          <Link className="w-header__quick" to="/optredens">Agenda</Link>
          <button className="w-header__icon" aria-label="Zoeken" type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
          </button>
          <button className="w-header__burger" aria-label="Menu openen" type="button" onClick={onOpenMenu}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16" /><path d="M4 17h16" /></svg>
          </button>
        </div>
      </div>
    </header>
  );
}
