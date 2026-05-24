import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { NewsletterBand } from "@/components/site/NewsletterBand";
import { MarkdownArticle } from "@/components/site/MarkdownArticle";
import { PhotoGallery } from "@/components/site/PhotoGallery";
import { fetchAlbumBySlug, youtubeNoCookieEmbed } from "@/lib/gallery";

export const Route = createFileRoute("/beeld-en-geluid/$slug")({
  loader: async ({ params }) => {
    const data = await fetchAlbumBySlug(params.slug);
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const a = loaderData?.album;
    if (!a) return { meta: [{ title: "Beeld en geluid — Wilhelmina Heerde" }] };
    const title = `${a.title} — Wilhelmina Heerde`;
    const description = a.excerpt ?? "";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: a.title },
        { property: "og:description", content: description },
        ...(a.cover_image_url
          ? [
              { property: "og:image", content: a.cover_image_url },
              { name: "twitter:image", content: a.cover_image_url },
            ]
          : []),
      ],
    };
  },
  notFoundComponent: () => (
    <SiteLayout>
      <div className="w-article__container" style={{ padding: "80px 0" }}>
        <h1>Album niet gevonden</h1>
      </div>
    </SiteLayout>
  ),
  component: AlbumDetail,
});

function AlbumDetail() {
  const { slug } = Route.useParams();
  const initial = Route.useLoaderData();
  const { data } = useQuery({
    queryKey: ["album", slug],
    queryFn: () => fetchAlbumBySlug(slug),
    initialData: initial,
  });

  if (!data) return null;
  const { album, photos } = data;
  const embedUrl = youtubeNoCookieEmbed(album.youtube_url);

  return (
    <SiteLayout>
      <article className="w-article">
        <div className="w-article__container">
          <Link className="w-article__back" to="/beeld-en-geluid">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
            Beeld en geluid
          </Link>

          <header className="w-article__head">
            {album.eyebrow && <p className="w-article__eyebrow">{album.eyebrow}</p>}
            <h1 className="w-article__title">{album.title}</h1>
            {album.excerpt && <p className="w-article__lead">{album.excerpt}</p>}
          </header>

          {embedUrl && (
            <div className="w-album__video">
              <iframe
                src={embedUrl}
                title={album.title}
                loading="lazy"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          )}

          {photos.length > 0 && (
            <div className="w-album__gallery">
              <PhotoGallery photos={photos} />
            </div>
          )}

          {album.body_md && <MarkdownArticle body={album.body_md} />}
        </div>
      </article>

      <NewsletterBand />
    </SiteLayout>
  );
}
