import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import robotoRegularUrl from "../styles/fonts/Roboto-Regular.woff2?url";
import robotoSemiBoldUrl from "../styles/fonts/Roboto-SemiBold.woff2?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Koninklijk Fanfarekorps Wilhelmina — Heerde" },
      { name: "description", content: "Sinds 1898 het muzikale hart van Heerde. Drie orkesten, ruim tachtig musici, één traditie." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Koninklijk Fanfarekorps Wilhelmina — Heerde" },
      { name: "twitter:title", content: "Koninklijk Fanfarekorps Wilhelmina — Heerde" },
      { property: "og:description", content: "Sinds 1898 het muzikale hart van Heerde. Drie orkesten, ruim tachtig musici, één traditie." },
      { name: "twitter:description", content: "Sinds 1898 het muzikale hart van Heerde. Drie orkesten, ruim tachtig musici, één traditie." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f72b1095-0d57-4674-a98e-0980c8aef05d/id-preview-b7ba03c9--9dced5fa-0dbf-4d68-b917-0e6025b887df.lovable.app-1779117873495.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f72b1095-0d57-4674-a98e-0980c8aef05d/id-preview-b7ba03c9--9dced5fa-0dbf-4d68-b917-0e6025b887df.lovable.app-1779117873495.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "preconnect", href: "https://wuteknilahqymkocgiir.supabase.co", crossOrigin: "anonymous" },
      { rel: "preload", as: "font", type: "font/woff2", href: robotoRegularUrl, crossOrigin: "anonymous" },
      { rel: "preload", as: "font", type: "font/woff2", href: robotoSemiBoldUrl, crossOrigin: "anonymous" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SESSION_KEY = "wh_sid";
    const SESSION_TS = "wh_sid_ts";
    const SESSION_TTL = 30 * 60 * 1000;

    function getSessionId(): string {
      try {
        const now = Date.now();
        const existing = sessionStorage.getItem(SESSION_KEY);
        const ts = Number(sessionStorage.getItem(SESSION_TS) ?? 0);
        if (existing && now - ts < SESSION_TTL) {
          sessionStorage.setItem(SESSION_TS, String(now));
          return existing;
        }
        const id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)).replace(/-/g, "");
        sessionStorage.setItem(SESSION_KEY, id);
        sessionStorage.setItem(SESSION_TS, String(now));
        return id;
      } catch {
        return "anon";
      }
    }

    function getDevice(): "mobile" | "tablet" | "desktop" {
      const w = window.innerWidth;
      if (w < 640) return "mobile";
      if (w < 1024) return "tablet";
      return "desktop";
    }

    let lastPath = "";
    function send(path: string) {
      if (!path || path === lastPath) return;
      if (
        path.startsWith("/admin") ||
        path.startsWith("/auth") ||
        path.startsWith("/login") ||
        path.startsWith("/api") ||
        path.startsWith("/_")
      )
        return;
      lastPath = path;
      const payload = JSON.stringify({
        path,
        referrer: document.referrer || null,
        session_id: getSessionId(),
        device: getDevice(),
      });
      try {
        const blob = new Blob([payload], { type: "application/json" });
        const ok = navigator.sendBeacon?.("/api/public/track", blob);
        if (!ok) {
          fetch("/api/public/track", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        /* ignore */
      }
    }

    // Initial pageview
    send(window.location.pathname);

    const unsub = router.subscribe("onResolved", (e) => {
      const path = e.toLocation?.pathname ?? window.location.pathname;
      send(path);
    });
    return () => {
      unsub();
    };
  }, [router]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
