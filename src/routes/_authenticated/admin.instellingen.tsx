import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AdminPage } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import { refreshStorageCacheHeaders } from "@/lib/storage-cache.functions";

export const Route = createFileRoute("/_authenticated/admin/instellingen")({
  component: Page,
});

type BucketResult = {
  bucket: string;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
};

function Page() {
  const refresh = useServerFn(refreshStorageCacheHeaders);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<BucketResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onRefresh() {
    if (!confirm("Alle media in storage opnieuw uploaden met 1 jaar cache-headers? Dit kan een paar minuten duren.")) return;
    setBusy(true);
    setError(null);
    setResults(null);
    try {
      const res = await refresh();
      setResults(res.results);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminPage title="Instellingen" description="Algemene instellingen, SEO-defaults en integraties.">
      <section className="space-y-4 rounded-lg border border-border bg-card p-6">
        <header>
          <h2 className="text-lg font-semibold text-foreground">Cache-headers vernieuwen</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Werkt bestaande media-bestanden bij naar 1 jaar browser-cache (max-age=31536000).
            Nieuwe uploads krijgen dit automatisch. Hoef je in principe maar één keer te doen.
          </p>
        </header>
        <Button onClick={onRefresh} disabled={busy}>
          {busy ? "Bezig…" : "Cache-headers vernieuwen"}
        </Button>
        {error && (
          <p className="text-sm text-destructive">Fout: {error}</p>
        )}
        {results && (
          <div className="space-y-2 text-sm">
            {results.map((r) => (
              <div key={r.bucket} className="rounded border border-border p-3">
                <div className="font-medium">{r.bucket}</div>
                <div className="text-muted-foreground">
                  Bijgewerkt: {r.updated} · Overgeslagen: {r.skipped} · Mislukt: {r.failed}
                </div>
                {r.errors.length > 0 && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-destructive">Fouten ({r.errors.length})</summary>
                    <ul className="mt-1 list-disc pl-5 text-xs text-destructive">
                      {r.errors.slice(0, 20).map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminPage>
  );
}
