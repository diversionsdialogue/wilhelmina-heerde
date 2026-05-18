import { useEffect } from "react";
import { Link } from "@tanstack/react-router";

type Props = {
  open: boolean;
  onClose: () => void;
};

const navItems = [
  { to: "/optredens", label: "Agenda" },
  { to: "/orkesten", label: "Orkesten" },
  { to: "/nieuws", label: "Nieuws" },
  { to: "/steun", label: "Steun ons" },
  { to: "/over", label: "Over ons" },
];

export function MobileMenu({ open, onClose }: Props) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <aside
      className={`w-mobile-menu${open ? " is-open" : ""}`}
      aria-hidden={!open}
    >
      <div className="w-mobile-menu__top">
        <Link className="w-header__brand" to="/" onClick={onClose} style={{ color: "var(--w-black)" }} aria-label="Wilhelmina — home">
          <span className="w-header__mark" aria-hidden="true" style={{ color: "var(--w-gold)" }} />
          <span className="w-header__wordmark">
            <span>WILHELMINA</span>
            <span>HEERDE · SINDS 1898</span>
          </span>
        </Link>
        <button className="w-header__icon" aria-label="Menu sluiten" type="button" onClick={onClose} style={{ color: "var(--w-black)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 6-12 12" /><path d="m6 6 12 12" /></svg>
        </button>
      </div>
      <nav className="w-mobile-menu__nav" aria-label="Mobiel menu">
        {navItems.map((n) => (
          <Link key={n.to} to={n.to} onClick={onClose}>
            <span>{n.label}</span>
            <span>→</span>
          </Link>
        ))}
      </nav>
      <div className="w-mobile-menu__aux">
        <a href="#" className="is-active">NL</a>
        <a href="#">EN</a>
        <Link to="/login" onClick={onClose} style={{ marginLeft: "auto" }}>Inloggen</Link>
      </div>
    </aside>
  );
}
