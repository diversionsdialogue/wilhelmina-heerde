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
  { to: "/p/$slug", params: { slug: "over-ons" }, label: "Over ons" },
  { to: "/nieuws", label: "Nieuws" },
  { to: "/beeld-en-geluid", label: "Beeld en geluid" },
] as const;

const colSecondary = [
  { slug: "a-orkest", label: "Orkest" },
  { slug: "wilhelminaband", label: "Wilhelminaband" },
  { slug: "bestuur", label: "Bestuur" },
  { slug: "dirigent", label: "Dirigent" },
  { slug: "wilhelmina-nieuw-talent", label: "Opleiding" },
  { slug: "lid-worden", label: "Lid worden" },
] as const;

const colTertiary = [
  { slug: "sponsoren", label: "Onze sponsors" },
] as const;

function normalizeHref(href: string | null | undefined): string | undefined {
  if (!href) return undefined;
  if (/^(https?:\/\/|\/|mailto:|tel:)/.test(href)) return href;
  return `/p/${href.replace(/^\/+/, "")}`;
}

export function MobileMenu({ open, onClose }: Props) {
  const fetchBanner = useServerFn(getMenuBanner);
  const banner = useQuery({
    queryKey: ["menu-banner"],
    queryFn: () => fetchBanner(),
    enabled: typeof window !== "undefined",
    staleTime: 60_000,
  });

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
          <button className="w-megamenu__icon" aria-label="Menu sluiten" type="button" onClick={onClose}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 6-12 12" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>
      </div>

      <div className="w-megamenu__body">
        <nav className="w-megamenu__col w-megamenu__col--primary" aria-label="Hoofdsecties">
          {colPrimary.map((n) =>
            "params" in n ? (
              <Link key={n.label} to={n.to} params={n.params} onClick={onClose} className="w-megamenu__primary-link">
                {n.label}
              </Link>
            ) : (
              <Link key={n.label} to={n.to} onClick={onClose} className="w-megamenu__primary-link">
                {n.label}
              </Link>
            )
          )}
        </nav>

        <nav className="w-megamenu__col w-megamenu__col--secondary" aria-label="Vereniging">
          {colSecondary.map((n) => (
            <Link
              key={n.label}
              to="/p/$slug"
              params={{ slug: n.slug }}
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
              to="/p/$slug"
              params={{ slug: n.slug }}
              onClick={onClose}
              className="w-megamenu__link"
            >
              {n.label}
            </Link>
          ))}
          <Link to="/contact" onClick={onClose} className="w-megamenu__link">
            Contact
          </Link>
        </nav>

        <a
          href={normalizeHref(banner.data?.href) || "/orkesten"}
          onClick={onClose}
          className="w-megamenu__feature"
        >
          <span
            className="w-megamenu__feature-media"
            aria-hidden="true"
            style={
              banner.data?.image_url
                ? {
                    backgroundImage: `url(${JSON.stringify(banner.data.image_url)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            {!banner.data?.image_url && <span className="ph ph--portrait-warm ph--no-mark" />}
          </span>
          <span className="w-megamenu__feature-body">
            <span className="w-megamenu__feature-title">
              {banner.data?.title || "Zelf muziek maken"}
            </span>
            <span className="w-megamenu__feature-cta">
              {banner.data?.cta_label || "Start direct"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </span>
          </span>
        </a>
      </div>
    </aside>
  );
}
