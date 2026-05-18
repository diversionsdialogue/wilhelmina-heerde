import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMenuBanner } from "@/lib/menu.functions";

type Props = {
  open: boolean;
  onClose: () => void;
};

const colPrimary = [
  { to: "/optredens", label: "Agenda" },
  { to: "/over", label: "Over ons" },
  { to: "/nieuws", label: "Nieuws" },
] as const;

const colSecondary = [
  { to: "/orkesten", label: "Orkest" },
  { to: "/over", label: "Bestuur", hash: "bestuur" },
  { to: "/over", label: "Dirigent", hash: "dirigent" },
  { to: "/orkesten", label: "Opleiding", hash: "opleiding" },
  { to: "/orkesten", label: "Lid worden", hash: "lid-worden" },
  { to: "/nieuws", label: "Beeld en geluid" },
] as const;

const colTertiary = [
  { to: "/steun", label: "Steun ons" },
  { to: "/steun", label: "Onze sponsors", hash: "sponsors" },
  { to: "/contact", label: "Contact" },
] as const;

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
      className={`w-megamenu${open ? " is-open" : ""}`}
      aria-hidden={!open}
      role="dialog"
      aria-label="Hoofdmenu"
    >
      <div className="w-megamenu__topbar">
        <Link className="w-megamenu__brand" to="/" onClick={onClose} aria-label="Wilhelmina — home">
          <span className="w-megamenu__mark" aria-hidden="true" />
          <span className="w-megamenu__wordmark">Wilhelmina Heerde</span>
        </Link>
        <div className="w-megamenu__topright">
          <Link to="/optredens" onClick={onClose}>Agenda</Link>
          <Link to="/login" onClick={onClose}>Inloggen</Link>
          <button className="w-megamenu__icon" aria-label="Zoeken" type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
          </button>
          <button className="w-megamenu__icon" aria-label="Menu sluiten" type="button" onClick={onClose}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 6-12 12" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>
      </div>

      <div className="w-megamenu__body">
        <nav className="w-megamenu__col w-megamenu__col--primary" aria-label="Hoofdsecties">
          {colPrimary.map((n) => (
            <Link key={n.label} to={n.to} onClick={onClose} className="w-megamenu__primary-link">
              {n.label}
            </Link>
          ))}
        </nav>

        <nav className="w-megamenu__col w-megamenu__col--secondary" aria-label="Vereniging">
          {colSecondary.map((n) => (
            <Link
              key={n.label}
              to={n.to}
              hash={"hash" in n ? n.hash : undefined}
              onClick={onClose}
              className="w-megamenu__link"
            >
              {n.label}
            </Link>
          ))}
          <span className="w-megamenu__divider" aria-hidden="true" />
          {colTertiary.map((n) => (
            <Link
              key={n.label}
              to={n.to}
              hash={"hash" in n ? n.hash : undefined}
              onClick={onClose}
              className="w-megamenu__link"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <Link to="/orkesten" onClick={onClose} className="w-megamenu__feature">
          <span className="w-megamenu__feature-media" aria-hidden="true">
            <span className="ph ph--portrait-warm ph--no-mark" />
          </span>
          <span className="w-megamenu__feature-body">
            <span className="w-megamenu__feature-title">Zelf muziek maken</span>
            <span className="w-megamenu__feature-cta">
              Start direct
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </span>
          </span>
        </Link>
      </div>
    </aside>
  );
}
