import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

type Props = {
  /** When true, the header starts in "over dark hero" mode and switches on scroll. */
  overDark?: boolean;
  onOpenMenu?: () => void;
};

export function SiteHeader({ overDark = false, onOpenMenu }: Props) {
  const [scrolled, setScrolled] = useState(!overDark);

  useEffect(() => {
    if (!overDark) {
      setScrolled(true);
      return;
    }
    const hero = document.querySelector(".w-hero") as HTMLElement | null;
    const onScroll = () => {
      const threshold = hero ? hero.offsetHeight - 80 : 80;
      setScrolled(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overDark]);

  const classes = ["w-header"];
  if (!scrolled && overDark) classes.push("is-over-dark");
  if (scrolled) classes.push("is-scrolled");

  return (
    <header className={classes.join(" ")} id="site-header">
      <div className="w-header__inner">
        <Link className="w-header__brand" to="/" aria-label="Wilhelmina — home">
          <span className="w-header__mark" aria-hidden="true" />
          <span className="w-header__wordmark">
            <span>WILHELMINA</span>
            <span>HEERDE · SINDS 1898</span>
          </span>
        </Link>

        <div className="w-header__actions">
          <Link className="w-header__quick" to="/optredens">Agenda</Link>
          <Link className="w-header__icon" to="/login" aria-label="Inloggen">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          </Link>
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
