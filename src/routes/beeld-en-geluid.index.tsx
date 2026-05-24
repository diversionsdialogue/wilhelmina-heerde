import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { NewsletterBand } from "@/components/site/NewsletterBand";
import { fetchPublishedAlbums } from "@/lib/gallery";

export const Route = createFileRoute("/beeld-en-geluid/")({
  head: () => ({
    meta: [
      { title: "Beeld en geluid — Wilhelmina Heerde" },
      { name: "description", content: "Foto's en video's van optredens van Koninklijk Fanfarekorps Wilhelmina." },
      { property: "og:title", content: "Beeld en geluid — Wilhelmina Heerde" },
      { property: "og:description", content: "Foto's en video's van optredens." },
    ],
  }),
  component: BeeldEnGeluidIndex,
});

function BeeldEnGeluidIndex() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["albums", "published"],
    queryFn: fetchPublishedAlbums,
  });

  return (
    <SiteLayout>
      <section className="w-archive-hero">
        <div className="w-archive-hero__photo" aria-hidden="true" />
        <div className="w-archive-hero__scrim" aria-hidden="true" />
        <div className="w-archive-hero__inner">
          <p className="w-archive-hero__eyebrow">Optredens in beeld</p>
          <h1 className="w-archive-hero__title">Beeld en geluid</h1>
        </div>
      </section>

      <section className="w-archive">
        <div className="w-container">
          {isLoading ? (
            <p className="w-archive__empty">Bezig met laden…</p>
          ) : error ? (
            <p className="w-archive__empty">Kon albums niet laden.</p>
          ) : (data?.length ?? 0) === 0 ? (
            <p className="w-archive__empty">Nog geen albums.</p>
          ) : (
            <div className="w-archive__grid">
              {data!.map((a) => (
                <Link
                  key={a.id}
                  className="w-acard"
                  to="/beeld-en-geluid/$slug"
                  params={{ slug: a.slug }}
                >
                  <div className="w-acard__media">
                    {a.cover_image_url ? (
                      <img src={a.cover_image_url} alt="" loading="lazy" />
                    ) : (
                      <span className="ph ph--hall" aria-hidden="true" />
                    )}
                  </div>
                  {a.eyebrow && <p className="w-acard__eyebrow">{a.eyebrow}</p>}
                  <h3 className="w-acard__title">{a.title}</h3>
                  {a.excerpt && <p className="w-acard__dek">{a.excerpt}</p>}
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
