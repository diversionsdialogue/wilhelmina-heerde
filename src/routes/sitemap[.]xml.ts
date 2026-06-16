import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://wilhelmina-heerde.nl";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const staticEntries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/optredens", changefreq: "weekly", priority: "0.9" },
          { path: "/nieuws", changefreq: "daily", priority: "0.9" },
          { path: "/orkesten", changefreq: "monthly", priority: "0.8" },
          { path: "/beeld-en-geluid", changefreq: "monthly", priority: "0.7" },
          { path: "/sponsoren", changefreq: "monthly", priority: "0.6" },
          { path: "/steun", changefreq: "monthly", priority: "0.7" },
          { path: "/contact", changefreq: "yearly", priority: "0.6" },
          { path: "/quickscan", changefreq: "yearly", priority: "0.5" },
        ];

        const entries: SitemapEntry[] = [...staticEntries];

        const [news, pages, albums] = await Promise.all([
          supabaseAdmin
            .from("news")
            .select("slug, updated_at, published_at")
            .eq("status", "published"),
          supabaseAdmin
            .from("pages")
            .select("slug, updated_at, published_at")
            .eq("status", "published"),
          supabaseAdmin
            .from("media_albums")
            .select("slug, updated_at, published_at")
            .eq("status", "published"),
        ]);

        for (const row of news.data ?? []) {
          entries.push({
            path: `/nieuws/${row.slug}`,
            lastmod: (row.updated_at ?? row.published_at ?? undefined)?.slice(0, 10),
            changefreq: "monthly",
            priority: "0.7",
          });
        }
        for (const row of pages.data ?? []) {
          entries.push({
            path: `/p/${row.slug}`,
            lastmod: (row.updated_at ?? row.published_at ?? undefined)?.slice(0, 10),
            changefreq: "monthly",
            priority: "0.6",
          });
        }
        for (const row of albums.data ?? []) {
          entries.push({
            path: `/beeld-en-geluid/${row.slug}`,
            lastmod: (row.updated_at ?? row.published_at ?? undefined)?.slice(0, 10),
            changefreq: "monthly",
            priority: "0.6",
          });
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
