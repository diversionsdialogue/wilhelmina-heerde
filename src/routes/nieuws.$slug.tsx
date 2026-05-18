import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { NewsletterBand } from "@/components/site/NewsletterBand";
import { MarkdownArticle, parseArticleBody, buildFaqJsonLd } from "@/components/site/MarkdownArticle";
import { fetchNewsBySlug, fetchPublishedNews, type NewsRow } from "@/lib/news";
import { formatDutchDate } from "@/lib/format";

export const Route = createFileRoute("/nieuws/$slug")({
  loader: async ({ params }) => {
    const [item, all] = await Promise.all([
      fetchNewsBySlug(params.slug),
      fetchPublishedNews(),
    ]);
    if (!item) throw notFound();
    const related = all.filter((n) => n.slug !== params.slug).slice(0, 3);
    return { item, related };
  },
  head: ({ loaderData }) => {
    const item = loaderData?.item;
    if (!item) {
      return { meta: [{ title: "Nieuws — Wilhelmina Heerde" }] };
    }
    const title = `${item.title} — Wilhelmina Heerde`;
    const description = item.excerpt ?? "";
    const { faqs } = parseArticleBody(item.body_md ?? "");
    const jsonLd = buildFaqJsonLd(faqs);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: item.title },
        { property: "og:description", content: description },
        ...(item.cover_image_url
          ? [
              { property: "og:image", content: item.cover_image_url },
              { name: "twitter:image", content: item.cover_image_url },
            ]
          : []),
      ],
      scripts: jsonLd
        ? [{ type: "application/ld+json", children: jsonLd }]
        : undefined,
    };
  },
  component: NieuwsDetail,
});

function NieuwsDetail() {
  const { slug } = Route.useParams();
  const { item: initial, related } = Route.useLoaderData();
  const { data: item } = useQuery({
    queryKey: ["news", "slug", slug],
    queryFn: () => fetchNewsBySlug(slug),
    initialData: initial,
  });

  if (!item) return null;

  return (
    <SiteLayout>
      <article className="w-article">
        <div className="w-article__container">
          <Link className="w-article__back" to="/nieuws">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
            Nieuws
          </Link>

          <header className="w-article__head">
            {item.eyebrow && <p className="w-article__eyebrow">{item.eyebrow}</p>}
            <h1 className="w-article__title">{item.title}</h1>
            <div className="w-article__meta">
              {item.published_at && (
                <p className="w-article__date">{formatDutchDate(item.published_at)}</p>
              )}
              <nav className="w-article__crumbs" aria-label="Kruimelpad">
                <Link to="/">Home</Link>
                <span aria-hidden="true">/</span>
                <Link to="/nieuws">Nieuws</Link>
                <span aria-hidden="true">/</span>
                <span aria-current="page">{item.title}</span>
              </nav>
            </div>
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

          <MarkdownArticle body={item.body_md ?? ""} />
        </div>
      </article>

      {related.length > 0 && <RelatedNews items={related} />}

      <NewsletterBand />
    </SiteLayout>
  );
}

function RelatedNews({ items }: { items: NewsRow[] }) {
  return (
    <section className="w-related">
      <div className="w-article__container">
        <header className="w-related__head">
          <p className="w-eyebrow">Lees ook</p>
        </header>

        <ul className="w-related__list">
          {items.map((s) => (
            <li key={s.id}>
              <Link className="w-related__card" to="/nieuws/$slug" params={{ slug: s.slug }}>
                <div className="w-related__media">
                  {s.cover_image_url ? (
                    <img src={s.cover_image_url} alt="" loading="lazy" />
                  ) : (
                    <span className={`ph ${s.cover_placeholder ?? "ph--portrait-warm"}`} aria-hidden="true" />
                  )}
                </div>
                <div className="w-related__body">
                  {s.eyebrow && <p className="w-related__eyebrow">{s.eyebrow}</p>}
                  <h3 className="w-related__title">{s.title}</h3>
                  {s.excerpt && <p className="w-related__dek">{s.excerpt}</p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
