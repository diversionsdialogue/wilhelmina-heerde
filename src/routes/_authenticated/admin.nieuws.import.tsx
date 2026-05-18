import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AdminPage } from "@/components/admin/AdminPage";
import { importNewsBatch } from "@/lib/news.functions";

export const Route = createFileRoute("/_authenticated/admin/nieuws/import")({
  component: Page,
});

type Result = {
  file: string;
  status: "imported" | "skipped" | "error";
  slug?: string;
  reason?: string;
};

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  // Chunked to avoid call-stack overflow on big files.
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function Page() {
  const runImport = useServerFn(importNewsBatch);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mdCount = files.filter((f) => f.name.toLowerCase().endsWith(".md")).length;
  const imgCount = files.length - mdCount;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!files.length) return;
    setBusy(true);
    setError(null);
    setResults(null);
    try {
      const payload = await Promise.all(
        files.map(async (f) => ({
          name: f.name,
          type: f.type,
          base64: await fileToBase64(f),
        })),
      );
      const res = await runImport({ data: { files: payload } });
      setResults(res.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminPage
      title="Markdown importeren"
      description="Sleep .md-bestanden en bijbehorende afbeeldingen hierheen."
      actions={
        <Link
          to="/admin/nieuws"
          style={{
            border: "1px solid #d4d4d4",
            color: "#333",
            padding: "9px 16px",
            borderRadius: 8,
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          ← Terug
        </Link>
      }
    >
      <form
        onSubmit={onSubmit}
        style={{
          background: "#fff",
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          padding: 28,
          display: "grid",
          gap: 16,
        }}
      >
        <label
          style={{
            border: "2px dashed #c9c9c9",
            borderRadius: 12,
            padding: 32,
            textAlign: "center",
            cursor: "pointer",
            background: "#fafafa",
          }}
        >
          <input
            type="file"
            multiple
            accept=".md,image/*"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            style={{ display: "none" }}
          />
          <div style={{ fontSize: 15, color: "#333", marginBottom: 6 }}>
            Klik om bestanden te selecteren
          </div>
          <div style={{ fontSize: 13, color: "#777" }}>
            .md-bestanden + .jpg/.png/.webp (relatieve paden in de markdown worden gematcht op bestandsnaam)
          </div>
        </label>

        {files.length > 0 && (
          <div style={{ fontSize: 13, color: "#555" }}>
            <strong>{files.length}</strong> bestand{files.length === 1 ? "" : "en"} geselecteerd —{" "}
            {mdCount} markdown, {imgCount} afbeelding{imgCount === 1 ? "" : "en"}.
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={!mdCount || busy}
            style={{
              background: !mdCount || busy ? "#999" : "#0d0d0d",
              color: "#fff",
              padding: "10px 22px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              border: 0,
              cursor: !mdCount || busy ? "default" : "pointer",
            }}
          >
            {busy ? "Bezig met importeren…" : `Importeer ${mdCount || 0} bericht${mdCount === 1 ? "" : "en"}`}
          </button>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: 12, borderRadius: 8, fontSize: 14 }}>
            {error}
          </div>
        )}

        {results && (
          <div style={{ marginTop: 8 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 12px" }}>Resultaat</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", color: "#666", borderBottom: "1px solid #eee" }}>
                  <th style={{ padding: "8px 6px" }}>Bestand</th>
                  <th style={{ padding: "8px 6px" }}>Status</th>
                  <th style={{ padding: "8px 6px" }}>Slug / reden</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f3f3f3" }}>
                    <td style={{ padding: "8px 6px", fontFamily: "monospace" }}>{r.file}</td>
                    <td style={{ padding: "8px 6px" }}>
                      {r.status === "imported" && <span style={{ color: "#15803d" }}>✓ geïmporteerd</span>}
                      {r.status === "skipped" && <span style={{ color: "#a16207" }}>⚠ overgeslagen</span>}
                      {r.status === "error" && <span style={{ color: "#b91c1c" }}>✗ fout</span>}
                    </td>
                    <td style={{ padding: "8px 6px", color: "#555" }}>
                      {r.status === "imported" && r.slug ? (
                        <a href={`/nieuws/${r.slug}`} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8" }}>
                          /nieuws/{r.slug}
                        </a>
                      ) : (
                        r.reason ?? r.slug ?? ""
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </form>
    </AdminPage>
  );
}
