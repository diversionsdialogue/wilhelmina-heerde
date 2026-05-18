import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { AdminPage } from "@/components/admin/AdminPage";
import {
  deleteMediaFile,
  listMedia,
  renameMediaFile,
  replaceMediaFile,
  MEDIA_BUCKETS,
  type MediaBucket,
  type MediaFile,
} from "@/lib/media.functions";

export const Route = createFileRoute("/_authenticated/admin/media")({
  component: Page,
});

const BUCKET_LABEL: Record<MediaBucket, string> = {
  "news-media": "Nieuws",
  "page-media": "Pagina's",
  "agenda-media": "Agenda",
  "menu-media": "Menu",
  "sponsor-logos": "Sponsors",
};

const OPTIMIZED_TYPES = new Set(["image/webp", "image/avif", "image/svg+xml"]);
const ACCEPTABLE_TYPES = new Set(["image/jpeg", "image/png", ...OPTIMIZED_TYPES]);
// Heuristic thresholds
const WARN_BYTES = 400 * 1024; // > 400 KB → too zwaar
const HEAVY_BYTES = 1024 * 1024; // > 1 MB → echt te zwaar

type Filter = "all" | MediaBucket;
type Sort = "newest" | "oldest" | "largest" | "name";

function Page() {
  const list = useServerFn(listMedia);
  const remove = useServerFn(deleteMediaFile);
  const rename = useServerFn(renameMediaFile);
  const replace = useServerFn(replaceMediaFile);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-media"],
    queryFn: () => list(),
    enabled: typeof window !== "undefined",
  });

  const delMut = useMutation({
    mutationFn: (f: { bucket: MediaBucket; path: string }) => remove({ data: f }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-media"] }),
  });

  const renameMut = useMutation({
    mutationFn: (f: { bucket: MediaBucket; path: string; newName: string }) => rename({ data: f }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-media"] }),
  });

  const replaceMut = useMutation({
    mutationFn: (f: {
      bucket: MediaBucket;
      path: string;
      newName: string;
      contentType: string;
      dataBase64: string;
    }) => replace({ data: f }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-media"] }),
  });

  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<MediaFile | null>(null);

  const files = query.data ?? [];

  const stats = useMemo(() => {
    let total = 0;
    let unoptimized = 0;
    let heavy = 0;
    for (const f of files) {
      total += f.size ?? 0;
      const mt = (f.mimetype ?? "").toLowerCase();
      if (mt.startsWith("image/") && !OPTIMIZED_TYPES.has(mt) && (f.size ?? 0) > WARN_BYTES) unoptimized++;
      if ((f.size ?? 0) > HEAVY_BYTES) heavy++;
    }
    return { count: files.length, total, unoptimized, heavy };
  }, [files]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = files.filter((f) => filter === "all" || f.bucket === filter);
    if (q) out = out.filter((f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q));
    out = out.slice();
    out.sort((a, b) => {
      switch (sort) {
        case "oldest":
          return (a.updated_at ?? "").localeCompare(b.updated_at ?? "");
        case "largest":
          return (b.size ?? 0) - (a.size ?? 0);
        case "name":
          return a.name.localeCompare(b.name);
        case "newest":
        default:
          return (b.updated_at ?? "").localeCompare(a.updated_at ?? "");
      }
    });
    return out;
  }, [files, filter, search, sort]);

  return (
    <AdminPage
      title="Media"
      description="Bibliotheek van alle geüploade afbeeldingen — gegroepeerd per onderdeel, met optimalisatie-indicatoren."
    >
      <section style={statRow()}>
        <Stat label="Bestanden" value={String(stats.count)} />
        <Stat label="Totale grootte" value={formatBytes(stats.total)} />
        <Stat label="Te zwaar (> 1 MB)" value={String(stats.heavy)} tone={stats.heavy > 0 ? "warn" : undefined} />
        <Stat label="Niet-geoptimaliseerd" value={String(stats.unoptimized)} tone={stats.unoptimized > 0 ? "warn" : undefined} />
      </section>

      <section style={card()}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <input
            style={{ ...input(), flex: "1 1 240px" }}
            placeholder="Zoek op bestandsnaam…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select style={{ ...input(), width: 200 }} value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
            <option value="all">Alle onderdelen</option>
            {MEDIA_BUCKETS.map((b) => (
              <option key={b} value={b}>{BUCKET_LABEL[b]}</option>
            ))}
          </select>
          <select style={{ ...input(), width: 200 }} value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="newest">Nieuwste eerst</option>
            <option value="oldest">Oudste eerst</option>
            <option value="largest">Grootste eerst</option>
            <option value="name">Bestandsnaam</option>
          </select>
        </div>

        {query.isLoading ? (
          <p style={muted()}>Laden…</p>
        ) : filtered.length === 0 ? (
          <p style={muted()}>Geen bestanden gevonden.</p>
        ) : (
          <div style={grid()}>
            {filtered.map((f) => (
              <button key={`${f.bucket}/${f.path}`} type="button" style={tile()} onClick={() => setActive(f)}>
                <div style={thumbWrap()}>
                  {isImage(f) ? (
                    <img src={f.publicUrl} alt={f.name} loading="lazy" style={thumb()} />
                  ) : (
                    <div style={{ ...thumb(), display: "grid", placeItems: "center", color: "#999", fontSize: 11 }}>
                      {f.mimetype ?? "bestand"}
                    </div>
                  )}
                  <BadgeStack file={f} />
                </div>
                <div style={tileMeta()}>
                  <div style={{ fontSize: 12, color: "#0d0d0d", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={f.name}>
                    {f.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#888", display: "flex", justifyContent: "space-between", gap: 6 }}>
                    <span>{BUCKET_LABEL[f.bucket]}</span>
                    <span>{formatBytes(f.size ?? 0)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {active && (
        <Detail
          file={active}
          onClose={() => setActive(null)}
          onDelete={() => {
            if (confirm(`"${active.name}" definitief verwijderen?`)) {
              delMut.mutate(
                { bucket: active.bucket, path: active.path },
                { onSuccess: () => setActive(null) },
              );
            }
          }}
          deleting={delMut.isPending}
          onRename={(newName) => {
            renameMut.mutate(
              { bucket: active.bucket, path: active.path, newName },
              {
                onSuccess: () => setActive(null),
                onError: (e: unknown) => alert(e instanceof Error ? e.message : "Hernoemen mislukt"),
              },
            );
          }}
          renaming={renameMut.isPending}
          onOptimize={async () => {
            try {
              const { base64, contentType, newName } = await convertToWebp(active);
              replaceMut.mutate(
                { bucket: active.bucket, path: active.path, newName, contentType, dataBase64: base64 },
                {
                  onSuccess: () => setActive(null),
                  onError: (e: unknown) => alert(e instanceof Error ? e.message : "Optimaliseren mislukt"),
                },
              );
            } catch (e) {
              alert(e instanceof Error ? e.message : "Conversie mislukt");
            }
          }}
          optimizing={replaceMut.isPending}
        />
      )}
    </AdminPage>
  );
}

async function convertToWebp(file: MediaFile): Promise<{ base64: string; contentType: string; newName: string }> {
  const res = await fetch(file.publicUrl);
  if (!res.ok) throw new Error("Kon bestand niet ophalen");
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  const MAX = 2000;
  const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas niet beschikbaar");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const webpBlob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("WebP-conversie mislukt"))), "image/webp", 0.85),
  );
  const buf = new Uint8Array(await webpBlob.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  const base64 = btoa(bin);
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const safeBase = baseName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return { base64, contentType: "image/webp", newName: `${safeBase}.webp` };
}

function Detail({
  file,
  onClose,
  onDelete,
  deleting,
  onRename,
  renaming,
  onOptimize,
  optimizing,
}: {
  file: MediaFile;
  onClose: () => void;
  onDelete: () => void;
  deleting: boolean;
  onRename: (newName: string) => void;
  renaming: boolean;
  onOptimize: () => void;
  optimizing: boolean;
}) {
  const [nameInput, setNameInput] = useState(file.name);
  useEffect(() => setNameInput(file.name), [file.name]);
  const mt = (file.mimetype ?? "").toLowerCase();
  const canOptimize = mt.startsWith("image/") && !OPTIMIZED_TYPES.has(mt);
  const busy = deleting || renaming || optimizing;
  const flags = optimizationFlags(file);
  return (
    <div style={overlay()} onClick={onClose}>
      <div style={modal()} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 24 }}>
          <div style={{ background: "#f4f4f4", display: "grid", placeItems: "center", minHeight: 320, borderRadius: 8, overflow: "hidden" }}>
            {isImage(file) ? (
              <img src={file.publicUrl} alt={file.name} style={{ maxWidth: "100%", maxHeight: "70vh", display: "block" }} />
            ) : (
              <p style={muted()}>Voorbeeld niet beschikbaar</p>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
            <div>
              <p style={{ fontSize: 11, color: "#999", margin: 0, textTransform: "uppercase", letterSpacing: ".06em" }}>{BUCKET_LABEL[file.bucket]}</p>
              <h2 style={{ fontSize: 18, margin: "4px 0 0", color: "#0d0d0d", wordBreak: "break-all" }}>{file.name}</h2>
            </div>
            <Row k="Pad" v={file.path} mono />
            <Row k="Type" v={file.mimetype ?? "—"} />
            <Row k="Grootte" v={formatBytes(file.size ?? 0)} />
            <Row k="Geüpload" v={file.created_at ? new Date(file.created_at).toLocaleString("nl-NL") : "—"} />
            <Row k="Gewijzigd" v={file.updated_at ? new Date(file.updated_at).toLocaleString("nl-NL") : "—"} />

            <div>
              <p style={{ fontSize: 12, color: "#666", margin: "0 0 6px" }}>Optimalisatie</p>
              {flags.length === 0 ? (
                <span style={pill("ok")}>OK</span>
              ) : (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {flags.map((f) => (
                    <span key={f.label} style={pill(f.tone)}>{f.label}</span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p style={{ fontSize: 12, color: "#666", margin: "0 0 6px" }}>Publieke URL</p>
              <div style={{ display: "flex", gap: 6 }}>
                <input readOnly value={file.publicUrl} style={{ ...input(), flex: 1, fontSize: 11 }} onFocus={(e) => e.currentTarget.select()} />
                <button style={btn()} onClick={() => navigator.clipboard.writeText(file.publicUrl)}>Kopieer</button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 12, borderTop: "1px solid #eee" }}>
              <a href={file.publicUrl} target="_blank" rel="noreferrer" style={{ ...btn(), textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Open</a>
              <button style={{ ...btnDanger(), marginLeft: "auto" }} disabled={deleting} onClick={onDelete}>
                {deleting ? "Verwijderen…" : "Verwijderen"}
              </button>
              <button style={btn()} onClick={onClose}>Sluiten</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BadgeStack({ file }: { file: MediaFile }) {
  const flags = optimizationFlags(file);
  if (flags.length === 0) return null;
  return (
    <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
      {flags.slice(0, 2).map((f) => (
        <span key={f.label} style={{ ...pill(f.tone), fontSize: 10, padding: "2px 6px" }}>{f.short}</span>
      ))}
    </div>
  );
}

function optimizationFlags(file: MediaFile): { label: string; short: string; tone: "warn" | "danger" | "info" }[] {
  const out: { label: string; short: string; tone: "warn" | "danger" | "info" }[] = [];
  const mt = (file.mimetype ?? "").toLowerCase();
  const size = file.size ?? 0;
  if (mt.startsWith("image/")) {
    if (!ACCEPTABLE_TYPES.has(mt)) out.push({ label: `Onbekend formaat (${mt})`, short: "?", tone: "info" });
    if (size > HEAVY_BYTES) out.push({ label: `Te zwaar (${formatBytes(size)})`, short: ">1MB", tone: "danger" });
    else if (size > WARN_BYTES && !OPTIMIZED_TYPES.has(mt)) out.push({ label: `Groot — overweeg WebP`, short: "groot", tone: "warn" });
  }
  return out;
}

function isImage(f: MediaFile) {
  return (f.mimetype ?? "").toLowerCase().startsWith("image/");
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: "#999", margin: 0, textTransform: "uppercase", letterSpacing: ".06em" }}>{k}</p>
      <p style={{ margin: "2px 0 0", fontSize: 13, color: "#0d0d0d", wordBreak: "break-all", fontFamily: mono ? "ui-monospace, SFMono-Regular, monospace" : undefined }}>{v}</p>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <div style={{ ...card(), padding: 16, flex: "1 1 180px" }}>
      <p style={{ margin: 0, fontSize: 12, color: "#777", textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</p>
      <p style={{ margin: "6px 0 0", fontSize: 22, fontWeight: 600, color: tone === "warn" ? "#b35a00" : "#0d0d0d" }}>{value}</p>
    </div>
  );
}

// Styles
const statRow = (): React.CSSProperties => ({ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 });
const card = (): React.CSSProperties => ({ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: 20 });
const input = (): React.CSSProperties => ({ height: 38, padding: "0 12px", border: "1px solid #d4d4d4", borderRadius: 8, fontSize: 13, background: "#fff", color: "#0d0d0d" });
const btn = (): React.CSSProperties => ({ height: 32, padding: "0 12px", borderRadius: 6, border: "1px solid #d4d4d4", background: "#fff", color: "#0d0d0d", fontSize: 12, cursor: "pointer" });
const btnDanger = (): React.CSSProperties => ({ ...btn(), color: "#b00020", borderColor: "#f1c0c7" });
const muted = (): React.CSSProperties => ({ color: "#888", fontSize: 13, margin: 0 });
const grid = (): React.CSSProperties => ({ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 });
const tile = (): React.CSSProperties => ({ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 10, overflow: "hidden", padding: 0, cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column" });
const thumbWrap = (): React.CSSProperties => ({ position: "relative", aspectRatio: "4 / 3", background: "#f4f4f4" });
const thumb = (): React.CSSProperties => ({ width: "100%", height: "100%", objectFit: "cover", display: "block" });
const tileMeta = (): React.CSSProperties => ({ padding: 8, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 });
const overlay = (): React.CSSProperties => ({ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "grid", placeItems: "center", padding: 24, zIndex: 50 });
const modal = (): React.CSSProperties => ({ background: "#fff", borderRadius: 14, padding: 24, maxWidth: 1000, width: "100%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 30px 80px rgba(0,0,0,.3)" });
function pill(tone: "ok" | "warn" | "danger" | "info"): React.CSSProperties {
  const colors: Record<string, { bg: string; fg: string; bd: string }> = {
    ok: { bg: "#e8f5e9", fg: "#1b5e20", bd: "#a5d6a7" },
    warn: { bg: "#fff3e0", fg: "#9a5300", bd: "#ffcc80" },
    danger: { bg: "#fdecea", fg: "#b00020", bd: "#f1c0c7" },
    info: { bg: "#eef3ff", fg: "#1f3b8a", bd: "#c2d2ff" },
  };
  const c = colors[tone];
  return { display: "inline-block", background: c.bg, color: c.fg, border: `1px solid ${c.bd}`, borderRadius: 999, padding: "3px 9px", fontSize: 11, fontWeight: 500 };
}
