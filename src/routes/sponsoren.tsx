import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { getPublicSponsors } from "@/lib/sponsors.functions";

export const Route = createFileRoute("/sponsoren")({
  head: () => ({
    meta: [
      { title: "Onze sponsors — Wilhelmina Heerde" },
      { name: "description", content: "De lokale ondernemers die Wilhelmina Heerde steunen en cultuur in ons dorp een warm hart toedragen." }, { property: "og:title", content: "Onze sponsors — Wilhelmina Heerde" }, { property: "og:description", content: "Lokale ondernemers die Wilhelmina Heerde steunen." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SponsorenPage,
});

function SponsorenPage() {
  const fetchSponsors = useServerFn(getPublicSponsors);
  const { data: sponsors = [], isLoading } = useQuery({
    queryKey: ["public-sponsors"],
    queryFn: () => fetchSponsors(),
    staleTime: 60_000,
  });

  return (
    <SiteLayout>
      <section className="w-pgheader">
        <div className="w-container">
          <p className="w-eyebrow">Sponsors</p>
          <h1 className="w-pgheader__title" style={{ marginTop: 14 }}>Onze sponsors</h1>
          <p className="w-pgheader__sub">
            Zonder de steun van onze sponsors zou Heerde een stuk stiller zijn. Dankzij de onderlinge verbinding met
            lokale ondernemers kunnen wij bijzondere projecten realiseren en investeren in de toekomst van onze
            vereniging. Op deze pagina zetten we de partners die cultuur in ons dorp een warm hart toedragen in de
            schijnwerpers.
          </p>
        </div>
      </section>

      <section className="w-section">
        <div className="w-container">
          {isLoading ? (
            <p className="w-muted">Sponsors laden…</p>
          ) : sponsors.length === 0 ? (
            <p className="w-muted">Nog geen sponsors beschikbaar.</p>
          ) : (
            <ul className="w-sponsors-grid">
              {sponsors.map((s) => (
                <li key={s.id} className="w-sponsors-grid__item">
                  {s.website_url ? (
                    <a
                      href={s.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-sponsors-grid__link"
                    >
                      {s.logo_url ? (
                        <img src={s.logo_url} alt={s.name} className="w-sponsors-grid__logo" loading="lazy" />
                      ) : (
                        <span className="w-sponsors-grid__placeholder" aria-hidden="true" />
                      )}
                      <span className="w-sponsors-grid__name">{s.name}</span>
                    </a>
                  ) : (
                    <div className="w-sponsors-grid__link">
                      {s.logo_url ? (
                        <img src={s.logo_url} alt={s.name} className="w-sponsors-grid__logo" loading="lazy" />
                      ) : (
                        <span className="w-sponsors-grid__placeholder" aria-hidden="true" />
                      )}
                      <span className="w-sponsors-grid__name">{s.name}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
