import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { SiteLayout } from "@/components/site/SiteLayout";
import { NewsletterBand } from "@/components/site/NewsletterBand";
import { fetchNewsBySlug } from "@/lib/news";
import { formatDutchDate } from "@/lib/format";

export const Route = createFileRoute("/nieuws/$slug")({
  head: ({ params }) => ({
    meta: [{ title: `${params.slug.replaceAll("-", " ")} — Wilhelmina Heerde` }],
  }),
  component: NieuwsDetail,
});

function NieuwsDetail() {
  const { slug } = Route.useParams();
  const { data: item, isLoading, error } = useQuery({
    queryKey: ["news", "slug", slug],
    queryFn: () => fetchNewsBySlug(slug),
  });

  return (
    <SiteLayout>
      <article className="w-article">
        <div className="w-article__container">
          <Link className="w-article__back" to="/nieuws">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
            Nieuws
          </Link>

          {isLoading ? (
            <p style={{ marginTop: "3rem" }}>Bezig met laden…</p>
          ) : error || !item ? (
            <div style={{ marginTop: "3rem" }}>
              <h1 className="w-article__title">Bericht niet gevonden</h1>
              <p>Dit nieuwsbericht bestaat niet of is niet meer beschikbaar.</p>
            </div>
          ) : (
            <>
              <header className="w-article__head">
                {item.eyebrow && <p className="w-article__eyebrow">{item.eyebrow}</p>}
                <h1 className="w-article__title">{item.title}</h1>
                {item.published_at && (
                  <p className="w-article__date">{formatDutchDate(item.published_at)}</p>
                )}
                {item.excerpt && <p className="w-article__lead">{item.excerpt}</p>}
              </header>

              <figure className="w-article__hero">
                <div className="w-article__hero-media">
                  {item.cover_image_url ? (
                    <img src={item.cover_image_url} alt="" />
                  ) : (
                    <span className={`ph ${item.cover_placeholder ?? "ph--portrait-warm"} ph--no-mark`} aria-hidden="true" />
                  )}
                </div>
              </figure>

              <div className="w-article__body">
                <ReactMarkdown
                  components={{
                    blockquote: ({ children }) => (
                      <div className="w-article__quote">{children}</div>
                    ),
                  }}
                >
                  {item.body_md ?? ""}
                </ReactMarkdown>
              </div>
            </>
          )}
        </div>
      </article>

      <NewsletterBand />
    </SiteLayout>
  );
}
