import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

export const Route = createFileRoute("/api/public/track")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as {
            path?: string;
            referrer?: string;
            session_id?: string;
            device?: string;
          };

          const path = (body.path ?? "").slice(0, 500);
          if (!path || !path.startsWith("/")) {
            return new Response(null, { status: 204 });
          }

          // Skip non-public paths
          if (
            path.startsWith("/admin") ||
            path.startsWith("/auth") ||
            path.startsWith("/login") ||
            path.startsWith("/api") ||
            path.startsWith("/_") ||
            path.includes("/sitemap")
          ) {
            return new Response(null, { status: 204 });
          }

          const ua = request.headers.get("user-agent") ?? "";
          // Basic bot filter
          if (/bot|crawler|spider|crawling|preview|monitor|axios|curl|wget|headless/i.test(ua)) {
            return new Response(null, { status: 204 });
          }

          const ip =
            request.headers.get("cf-connecting-ip") ||
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            request.headers.get("x-real-ip") ||
            "0.0.0.0";

          const country = request.headers.get("cf-ipcountry") ?? null;

          // Daily-rotating salt → IP is never stored
          const day = new Date().toISOString().slice(0, 10);
          const salt = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "wilhelmina";
          const raw = `${ip}|${ua}|${day}|${salt}`;
          const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
          const visitor_hash = Array.from(new Uint8Array(buf))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")
            .slice(0, 32);

          let referrerHost: string | null = null;
          if (body.referrer) {
            try {
              const url = new URL(body.referrer);
              const selfHost = new URL(request.url).host;
              if (url.host && url.host !== selfHost) {
                referrerHost = url.host.replace(/^www\./, "").slice(0, 200);
              }
            } catch {
              /* ignore */
            }
          }

          const device =
            body.device === "mobile" || body.device === "tablet" || body.device === "desktop"
              ? body.device
              : "desktop";

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.from("page_views").insert({
            path,
            referrer: referrerHost,
            session_id: body.session_id?.slice(0, 64) ?? null,
            visitor_hash,
            device,
            country,
          });
        } catch (err) {
          console.error("track error", err);
        }
        return new Response(null, { status: 204 });
      },
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "POST, OPTIONS",
            "access-control-allow-headers": "content-type",
          },
        }),
    },
  },
});
