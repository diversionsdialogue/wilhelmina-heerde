import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { matchRedirect } from "@/lib/redirects";
import { logNotFound } from "@/lib/not-found-log.functions";

export const Route = createFileRoute("/$")({
  beforeLoad: ({ location }) => {
    const target = matchRedirect(location.pathname);
    if (target) {
      const url = `${target}${location.searchStr ?? ""}${location.hash ? `#${location.hash}` : ""}`;
      throw redirect({ href: url, code: 301, throw: true });
    }

    // Log de 404 (fire-and-forget; geen await zodat de render niet wacht
    // op het DB-rondje).
    void logNotFound({ data: { path: location.pathname.slice(0, 2048) } }).catch(() => {
      // bewust stil — log mag nooit een 404-pagina breken
    });
  },
  head: () => ({ meta: [{ title: "Pagina niet gevonden — Wilhelmina Heerde" }, { name: "description", content: "Deze pagina van Wilhelmina Heerde bestaat niet (meer)." }, { name: "robots", content: "noindex" }, { property: "og:title", content: "Pagina niet gevonden — Wilhelmina Heerde" }, { property: "og:description", content: "Deze pagina bestaat niet (meer)." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Pagina niet gevonden</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          De pagina die je zoekt bestaat niet (meer) of is verplaatst.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Terug naar home
          </Link>
        </div>
      </div>
    </div>
  );
}
