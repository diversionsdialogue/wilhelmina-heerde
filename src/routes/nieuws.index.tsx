import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { NewsletterBand } from "@/components/site/NewsletterBand";
import { fetchPublishedNews } from "@/lib/news";

export const Route = createFileRoute("/nieuws/")({
  head: () => ({
    meta: [
      { title: "Nieuws — Wilhelmina Heerde" },
      { name: "description", content: "Interviews, achtergronden en aankondigingen van Koninklijk Fanfarekorps Wilhelmina." },
      { property: "og:title", content: "Nieuws — Wilhelmina Heerde" },
      { property: "og:description", content: "Interviews, achtergronden en aankondigingen." },
    ],
  }),
  component: NieuwsPage,
});

function NieuwsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["news", "published"],
    queryFn: fetchPublishedNews,
  });

  return (
    <SiteLayout>
      <section className="w-archive-hero">
        <div className="w-archive-hero__photo" aria-hidden="true" />
        <div className="w-archive-hero__scrim" aria-hidden="true" />
        <div className="w-archive-hero__inner">
          <p className="w-archive-hero__eyebrow">Achter de partituur</p>
          <h1 className="w-archive-hero__title">Nieuws</h1>
        </div>
      </section>

      <div className="w-archive-filters" role="search">
        <div className="w-archive-filters__inner">
          <label className="w-archive-filters__search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
            <input type="search" placeholder="Zoek op sleutelwoord, dirigent of componist" aria-label="Zoek" />
          </label>
          <label className="w-archive-filters__select">
            <span>Categorie</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            <select aria-label="Categorie"><option>Alle categorieën</option></select>
          </label>
          <div className="w-archive-filters__sort" aria-label="Sortering">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M7 12h10" /><path d="M10 18h4" /></svg>
            Nieuwste eerst
          </div>
        </div>
      </div>

      <section className="w-archive">
        <div className="w-container">
          {isLoading ? (
            <p className="w-archive__empty">Bezig met laden…</p>
          ) : error ? (
            <p className="w-archive__empty">Kon nieuws niet laden.</p>
          ) : (data?.length ?? 0) === 0 ? (
            <p className="w-archive__empty">Nog geen berichten.</p>
          ) : (
            <div className="w-archive__grid">
              {data!.map((i) => (
                <Link
                  key={i.id}
                  className="w-acard"
                  to="/nieuws/$slug"
                  params={{ slug: i.slug }}
                >
                  <div className="w-acard__media">
                    {i.cover_image_url ? (
                      <img src={i.cover_image_url} alt="" loading="lazy" />
                    ) : (
                      <span className={`ph ${i.cover_placeholder ?? "ph--hall"}`} aria-hidden="true" />
                    )}
                  </div>
                  {i.eyebrow && <p className="w-acard__eyebrow">{i.eyebrow}</p>}
                  <h3 className="w-acard__title">{i.title}</h3>
                  {i.excerpt && <p className="w-acard__dek">{i.excerpt}</p>}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <NewsletterBand />
    </SiteLayout>
  );
}
