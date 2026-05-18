import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { listMedia, MEDIA_BUCKETS, type MediaBucket, type MediaFile } from "@/lib/media.functions";

const BUCKET_LABEL: Record<MediaBucket, string> = {
  "news-media": "Nieuws",
  "page-media": "Pagina's",
  "agenda-media": "Agenda",
  "menu-media": "Menu",
  "sponsor-logos": "Sponsors",
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  defaultBucket?: MediaBucket;
};

export function MediaPickerDialog({ open, onClose, onSelect, defaultBucket }: Props) {
  const list = useServerFn(listMedia);
  const query = useQuery({
    queryKey: ["admin-media"],
    queryFn: () => list(),
    enabled: open,
  });

  const [filter, setFilter] = useState<"all" | MediaBucket>(defaultBucket ?? "all");
  const [search, setSearch] = useState("");

  const files = query.data ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return files
      .filter((f) => (f.mimetype ?? "").toLowerCase().startsWith("image/"))
      .filter((f) => filter === "all" || f.bucket === filter)
      .filter((f) => !q || f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q));
  }, [files, filter, search]);

  if (!open) return null;

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: "#0d0d0d" }}>Mediabank</h2>
          <button onClick={onClose} style={btn}>Sluiten</button>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <input
            style={{ ...input, flex: "1 1 240px" }}
            placeholder="Zoek op bestandsnaam…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select style={{ ...input, width: 200 }} value={filter} onChange={(e) => setFilter(e.target.value as "all" | MediaBucket)}>
            <option value="all">Alle onderdelen</option>
            {MEDIA_BUCKETS.map((b) => (
              <option key={b} value={b}>{BUCKET_LABEL[b]}</option>
            ))}
          </select>
        </div>
        {query.isLoading ? (
          <p style={{ color: "#888", fontSize: 13 }}>Laden…</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: "#888", fontSize: 13 }}>Geen afbeeldingen gevonden.</p>
        ) : (
          <div style={grid}>
            {filtered.map((f: MediaFile) => (
              <button
                key={`${f.bucket}/${f.path}`}
                type="button"
                style={tile}
                onClick={() => { onSelect(f.publicUrl); onClose(); }}
              >
                <div style={thumbWrap}>
                  <img src={f.publicUrl} alt={f.name} loading="lazy" style={thumb} />
                </div>
                <div style={{ padding: 6, fontSize: 11, color: "#0d0d0d", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={f.name}>
                  {f.name}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "grid", placeItems: "center", padding: 24, zIndex: 60 };
const modal: React.CSSProperties = { background: "#fff", borderRadius: 14, padding: 20, maxWidth: 1000, width: "100%", maxHeight: "85vh", overflow: "auto", boxShadow: "0 30px 80px rgba(0,0,0,.3)" };
const input: React.CSSProperties = { height: 36, padding: "0 12px", border: "1px solid #d4d4d4", borderRadius: 8, fontSize: 13, background: "#fff", color: "#0d0d0d" };
const btn: React.CSSProperties = { height: 32, padding: "0 12px", borderRadius: 6, border: "1px solid #d4d4d4", background: "#fff", color: "#0d0d0d", fontSize: 12, cursor: "pointer" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 };
const tile: React.CSSProperties = { background: "#fff", border: "1px solid #e8e8e8", borderRadius: 10, overflow: "hidden", padding: 0, cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column" };
const thumbWrap: React.CSSProperties = { aspectRatio: "4 / 3", background: "#f4f4f4" };
const thumb: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", display: "block" };
