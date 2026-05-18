import { createFileRoute, notFound } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { MarkdownArticle, parseArticleBody, buildFaqJsonLd } from "@/components/site/MarkdownArticle";
import { supabase } from "@/integrations/supabase/client";

type PageRow = {
  id: string;
  slug: string;
  title: string;
  eyebrow: string | null;
  excerpt: string | null;
  body_md: string | null;
  cover_image_url: string | null;
};

async function fetchPageBySlug(slug: string): Promise<PageRow | null> {
  const { data, error } = await supabase
    .from("pages")
    .select("id, slug, title, eyebrow, excerpt, body_md, cover_image_url")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return (data as PageRow) ?? null;
}

export const Route = createFileRoute("/p/$slug")({
  loader: async ({ params }) => {
    const item = await fetchPageBySlug(params.slug);
    if (!item) throw notFound();
    return { item };
  },
  head: ({ loaderData }) => {
    const item = loaderData?.item;
    if (!item) return { meta: [{ title: "Pagina — Wilhelmina Heerde" }] };
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
      scripts: jsonLd ? [{ type: "application/ld+json", children: jsonLd }] : undefined,
    };
  },
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="w-article__container" style={{ padding: "80px 0" }}>
        <p>Er ging iets mis: {error.message}</p>
      </div>
    </SiteLayout>
  ),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="w-article__container" style={{ padding: "80px 0" }}>
        <h1>Pagina niet gevonden</h1>
      </div>
    </SiteLayout>
  ),
  component: PageDetail,
});

function PageDetail() {
  const { item } = Route.useLoaderData();
  return (
    <SiteLayout>
      <article className="w-article">
        <div className="w-article__container">
          <header className="w-article__head">
            {item.eyebrow && <p className="w-article__eyebrow">{item.eyebrow}</p>}
            <h1 className="w-article__title">{item.title}</h1>
            {item.excerpt && <p className="w-article__lead">{item.excerpt}</p>}
          </header>

          {item.cover_image_url && (
            <figure className="w-article__hero">
              <div className="w-article__hero-media">
                <img src={item.cover_image_url} alt="" />
              </div>
            </figure>
          )}

          <MarkdownArticle body={item.body_md ?? ""} />
        </div>
      </article>
    </SiteLayout>
  );
}
