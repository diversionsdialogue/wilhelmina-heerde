import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { AdminPage } from "@/components/admin/AdminPage";
import { optimizeImageForUpload } from "@/lib/optimizeImage";
import { MediaPickerDialog } from "@/components/admin/MediaPickerDialog";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteAlbum,
  getAlbumAdmin,
  listAlbums,
  upsertAlbum,
  type AlbumAdminRow,
  type AlbumStatus,
} from "@/lib/gallery.functions";

export const Route = createFileRoute("/_authenticated/admin/beeld-en-geluid")({
  component: Page,
});

type PhotoDraft = {
  id?: string;
  image_url: string;
  caption: string;
};

type Draft = {
  id?: string;
  slug: string;
  title: string;
  eyebrow: string;
  excerpt: string;
  body_md: string;
  cover_image_url: string | null;
  youtube_url: string;
  status: AlbumStatus;
  published_at: string;
  photos: PhotoDraft[];
};

const EMPTY: Draft = {
  slug: "",
  title: "",
  eyebrow: "",
  excerpt: "",
  body_md: "",
  cover_image_url: null,
  youtube_url: "",
  status: "draft",
  published_at: "",
  photos: [],
};

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("nl-NL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Page() {
  const list = useServerFn(listAlbums);
  const getOne = useServerFn(getAlbumAdmin);
  const save = useServerFn(upsertAlbum);
  const remove = useServerFn(deleteAlbum);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-albums"],
    queryFn: () => list(),
    enabled: typeof window !== "undefined",
  });

  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [showPickerCover, setShowPickerCover] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const saveMut = useMutation({
    mutationFn: (d: Draft) =>
      save({
        data: {
          id: d.id,
          slug: d.slug.trim() || null,
          title: d.title.trim(),
          eyebrow: d.eyebrow.trim() || null,
          excerpt: d.excerpt.trim() || null,
          body_md: d.body_md,
          cover_image_url: d.cover_image_url || null,
          youtube_url: d.youtube_url.trim() || null,
          status: d.status,
          published_at:
            d.status === "published" && d.published_at
              ? new Date(d.published_at).toISOString()
              : null,
          photos: d.photos.map((p, i) => ({
            id: p.id,
            image_url: p.image_url,
            caption: p.caption.trim() || null,
            sort_order: i,
          })),
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-albums"] });
      setDraft(EMPTY);
      setShowForm(false);
      setErr(null);
    },
    onError: (e: Error) => setErr(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-albums"] }),
  });

  async function startEdit(item: AlbumAdminRow) {
    setErr(null);
    try {
      const full = await getOne({ data: { id: item.id } });
      setDraft({
        id: full.album.id,
        slug: full.album.slug,
        title: full.album.title,
        eyebrow: full.album.eyebrow ?? "",
        excerpt: full.album.excerpt ?? "",
        body_md: full.album.body_md ?? "",
        cover_image_url: full.album.cover_image_url,
        youtube_url: full.album.youtube_url ?? "",
        status: full.album.status as AlbumStatus,
        published_at: toLocalInput(full.album.published_at),
        photos: (full.photos as { id: string; image_url: string; caption: string | null }[]).map((p) => ({
          id: p.id,
          image_url: p.image_url,
          caption: p.caption ?? "",
        })),
      });
      setShowForm(true);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Kon album niet laden.");
    }
  }

  function startNew() {
    setDraft(EMPTY);
    setShowForm(true);
    setErr(null);
  }

  async function uploadOne(file: File): Promise<string> {
    const { blob, contentType, ext } = await optimizeImageForUpload(file);
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("gallery-media")
      .upload(path, blob, { upsert: false, contentType, cacheControl: "31536000" });
    if (error) throw error;
    const { data } = supabase.storage.from("gallery-media").getPublicUrl(path);
    return data.publicUrl;
  }

  async function onUploadCover(file: File) {
    setErr(null);
    setUploading(true);
    try {
      const url = await uploadOne(file);
      setDraft((d) => ({ ...d, cover_image_url: url }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload mislukt");
    } finally {
      setUploading(false);
    }
  }

  async function onUploadPhotos(files: FileList) {
    setErr(null);
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        const url = await uploadOne(f);
        urls.push(url);
      }
      setDraft((d) => ({
        ...d,
        photos: [...d.photos, ...urls.map((u) => ({ image_url: u, caption: "" }))],
      }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload mislukt");
    } finally {
      setUploading(false);
    }
  }

  // Drag-to-reorder
  const dragIndex = useRef<number | null>(null);
  function onDragStart(i: number) {
    dragIndex.current = i;
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }
  function onDrop(i: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from == null || from === i) return;
    setDraft((d) => {
      const next = d.photos.slice();
      const [m] = next.splice(from, 1);
      next.splice(i, 0, m);
      return { ...d, photos: next };
    });
  }
  function movePhoto(i: number, dir: -1 | 1) {
    setDraft((d) => {
      const j = i + dir;
      if (j < 0 || j >= d.photos.length) return d;
      const next = d.photos.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return { ...d, photos: next };
    });
  }
  function removePhoto(i: number) {
    setDraft((d) => ({ ...d, photos: d.photos.filter((_, k) => k !== i) }));
  }
  function updateCaption(i: number, caption: string) {
    setDraft((d) => ({
      ...d,
      photos: d.photos.map((p, k) => (k === i ? { ...p, caption } : p)),
    }));
  }

  useEffect(() => setErr(null), [draft.id]);

  return (
    <AdminPage
      title="Beeld en geluid"
      description="Beheer fotogalerijen en video's van optredens."
      actions={
        <button style={btnPrimary} onClick={startNew}>
          + Nieuw album
        </button>
      }
    >
      {showForm && (
        <section style={{ ...card, marginBottom: 20 }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={h2Style}>{draft.id ? "Album bewerken" : "Nieuw album"}</h2>
            <button
              style={btn}
              onClick={() => {
                setShowForm(false);
                setDraft(EMPTY);
                setErr(null);
              }}
            >
              Sluiten
            </button>
          </header>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Titel">
              <input style={input} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <Field label="Slug (leeg = automatisch)">
              <input
                style={input}
                placeholder="kerstconcert-2025"
                value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
              />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <Field label="Eyebrow (optioneel)">
              <input style={input} value={draft.eyebrow} onChange={(e) => setDraft({ ...draft, eyebrow: e.target.value })} />
            </Field>
            <Field label="Status">
              <select
                style={input}
                value={draft.status}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    status: e.target.value as AlbumStatus,
                    published_at:
                      e.target.value === "published" && !d.published_at
                        ? toLocalInput(new Date().toISOString())
                        : d.published_at,
                  }))
                }
              >
                <option value="draft">Concept</option>
                <option value="published">Gepubliceerd</option>
              </select>
            </Field>
            <Field label="Publicatiedatum">
              <input
                type="datetime-local"
                style={input}
                value={draft.published_at}
                onChange={(e) => setDraft({ ...draft, published_at: e.target.value })}
                disabled={draft.status !== "published"}
              />
            </Field>
          </div>

          <Field label="Korte introductie / excerpt">
            <textarea
              style={{ ...input, height: 64, padding: 10, resize: "vertical" }}
              value={draft.excerpt}
              onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
            />
          </Field>

          <Field label="YouTube-URL (optioneel — wordt cookievrij ingebed)">
            <input
              style={input}
              placeholder="https://www.youtube.com/watch?v=…"
              value={draft.youtube_url}
              onChange={(e) => setDraft({ ...draft, youtube_url: e.target.value })}
            />
          </Field>

          <Field label="Cover-afbeelding">
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={coverThumb}>
                {draft.cover_image_url ? (
                  <img src={draft.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 11, color: "#999" }}>geen</span>
                )}
              </div>
              <div style={{ display: "grid", gap: 6, flex: 1 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <label style={{ ...btn, display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
                    Uploaden
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void onUploadCover(f);
                      }}
                    />
                  </label>
                  <button type="button" style={btn} onClick={() => setShowPickerCover(true)}>
                    Mediabank
                  </button>
                </div>
                <input
                  style={input}
                  placeholder="…of plak een afbeeldings-URL"
                  value={draft.cover_image_url ?? ""}
                  onChange={(e) => setDraft({ ...draft, cover_image_url: e.target.value })}
                />
              </div>
            </div>
          </Field>

          <Field label={`Foto's in album (${draft.photos.length})`}>
            <div style={{ display: "grid", gap: 8 }}>
              <label style={{ ...btnPrimary, display: "inline-flex", alignItems: "center", cursor: "pointer", width: "fit-content" }}>
                + Foto's toevoegen
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      void onUploadPhotos(e.target.files);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
              {uploading && <p style={muted}>Bezig met uploaden…</p>}

              {draft.photos.length > 0 && (
                <div style={photoGrid}>
                  {draft.photos.map((p, i) => (
                    <div
                      key={`${p.image_url}-${i}`}
                      draggable
                      onDragStart={() => onDragStart(i)}
                      onDragOver={onDragOver}
                      onDrop={() => onDrop(i)}
                      style={photoCard}
                    >
                      <div style={photoThumb}>
                        <img src={p.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <span style={photoIndex}>{i + 1}</span>
                      </div>
                      <input
                        style={{ ...input, height: 30, fontSize: 12 }}
                        placeholder="Bijschrift (optioneel)"
                        value={p.caption}
                        onChange={(e) => updateCaption(i, e.target.value)}
                      />
                      <div style={{ display: "flex", gap: 4 }}>
                        <button type="button" style={{ ...btnSmall, flex: 1 }} onClick={() => movePhoto(i, -1)} disabled={i === 0}>
                          ↑
                        </button>
                        <button type="button" style={{ ...btnSmall, flex: 1 }} onClick={() => movePhoto(i, 1)} disabled={i === draft.photos.length - 1}>
                          ↓
                        </button>
                        <button type="button" style={{ ...btnSmallDanger, flex: 1 }} onClick={() => removePhoto(i)}>
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p style={muted}>Tip: sleep foto's om de volgorde te wijzigen. De eerste foto is het grootst in het collage-overzicht.</p>
            </div>
          </Field>

          <Field label="Tekst onder de galerij (Markdown, optioneel)">
            <MarkdownEditor
              value={draft.body_md}
              onChange={(v) => setDraft({ ...draft, body_md: v })}
              placeholder={"Toelichting bij dit optreden…"}
              textareaStyle={{ ...input, height: 240, padding: 12, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13, lineHeight: 1.55, resize: "vertical" }}
            />
          </Field>

          {err && <p style={errStyle}>{err}</p>}

          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <button
              style={btnPrimary}
              disabled={!draft.title.trim() || saveMut.isPending || uploading}
              onClick={() => saveMut.mutate(draft)}
            >
              {saveMut.isPending ? "Opslaan…" : draft.id ? "Wijzigingen opslaan" : "Album aanmaken"}
            </button>
            {draft.id && (
              <button
                style={{ ...btnDanger, marginLeft: "auto" }}
                disabled={delMut.isPending}
                onClick={() => {
                  if (!draft.id) return;
                  if (confirm(`Album "${draft.title}" verwijderen? Foto's blijven in de mediabank staan.`)) {
                    delMut.mutate(draft.id, {
                      onSuccess: () => {
                        setShowForm(false);
                        setDraft(EMPTY);
                      },
                    });
                  }
                }}
              >
                {delMut.isPending ? "Verwijderen…" : "Verwijder album"}
              </button>
            )}
          </div>
        </section>
      )}

      <section style={card}>
        {query.isLoading && <p style={muted}>Laden…</p>}
        {query.error && <p style={errStyle}>Kon albums niet laden.</p>}
        {query.data && query.data.length === 0 && (
          <p style={muted}>
            Nog geen albums. Klik rechtsboven op <strong>+ Nieuw album</strong>.
          </p>
        )}

        {query.data && query.data.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#666", borderBottom: "1px solid #eee" }}>
                <th style={th}>Titel</th>
                <th style={th}>Slug</th>
                <th style={th}>Foto's</th>
                <th style={th}>Status</th>
                <th style={th}>Gepubliceerd</th>
                <th style={{ ...th, textAlign: "right" }}>Acties</th>
              </tr>
            </thead>
            <tbody>
              {query.data.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f3f3f3" }}>
                  <td style={td}>
                    <div style={{ fontWeight: 600, color: "#0d0d0d" }}>{p.title}</div>
                    {p.eyebrow && <div style={{ color: "#888", fontSize: 12 }}>{p.eyebrow}</div>}
                  </td>
                  <td style={{ ...td, color: "#555", fontFamily: "ui-monospace, monospace" }}>{p.slug}</td>
                  <td style={td}>{p.photo_count}</td>
                  <td style={td}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                        background: p.status === "published" ? "#dcfce7" : "#f1f5f9",
                        color: p.status === "published" ? "#166534" : "#475569",
                      }}
                    >
                      {p.status === "published" ? "Gepubliceerd" : "Concept"}
                    </span>
                  </td>
                  <td style={{ ...td, color: "#666" }}>{fmt(p.published_at)}</td>
                  <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                    {p.status === "published" && (
                      <a href={`/beeld-en-geluid/${p.slug}`} target="_blank" rel="noreferrer" style={{ ...btn, textDecoration: "none", marginRight: 6, display: "inline-block", lineHeight: "30px" }}>
                        Bekijk
                      </a>
                    )}
                    <button style={{ ...btn, marginRight: 6 }} onClick={() => startEdit(p)}>
                      Bewerk
                    </button>
                    <button
                      style={btnDanger}
                      onClick={() => {
                        if (confirm(`Album "${p.title}" verwijderen?`)) delMut.mutate(p.id);
                      }}
                    >
                      Verwijder
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <MediaPickerDialog
        open={showPickerCover}
        onClose={() => setShowPickerCover(false)}
        onSelect={(url) => setDraft((d) => ({ ...d, cover_image_url: url }))}
      />
    </AdminPage>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6, marginBottom: 12 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>{label}</span>
      {children}
    </label>
  );
}

const card: React.CSSProperties = { background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 20 };
const h2Style: React.CSSProperties = { fontSize: 16, fontWeight: 700, margin: 0 };
const input: React.CSSProperties = { height: 36, padding: "0 12px", border: "1px solid #d4d4d4", borderRadius: 8, fontSize: 13, background: "#fff", color: "#0d0d0d", width: "100%" };
const btn: React.CSSProperties = { height: 32, padding: "0 12px", borderRadius: 6, border: "1px solid #d4d4d4", background: "#fff", color: "#0d0d0d", fontSize: 12, cursor: "pointer" };
const btnPrimary: React.CSSProperties = { ...btn, background: "#0d0d0d", color: "#fff", border: "1px solid #0d0d0d", fontWeight: 600 };
const btnDanger: React.CSSProperties = { ...btn, background: "#fff", color: "#b91c1c", border: "1px solid #fca5a5" };
const btnSmall: React.CSSProperties = { ...btn, height: 26, fontSize: 11, padding: "0 6px" };
const btnSmallDanger: React.CSSProperties = { ...btnSmall, color: "#b91c1c", borderColor: "#fca5a5" };
const th: React.CSSProperties = { padding: "8px 6px", fontWeight: 600, fontSize: 12 };
const td: React.CSSProperties = { padding: "10px 6px", verticalAlign: "top" };
const muted: React.CSSProperties = { color: "#888", fontSize: 12, margin: 0 };
const errStyle: React.CSSProperties = { color: "#b91c1c", fontSize: 13, marginTop: 8 };
const coverThumb: React.CSSProperties = { width: 140, height: 92, background: "#f5f5f5", borderRadius: 8, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" };
const photoGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 };
const photoCard: React.CSSProperties = { display: "grid", gap: 4, background: "#fafafa", border: "1px solid #eee", borderRadius: 8, padding: 6, cursor: "grab" };
const photoThumb: React.CSSProperties = { position: "relative", aspectRatio: "4 / 3", borderRadius: 6, overflow: "hidden", background: "#eee" };
const photoIndex: React.CSSProperties = { position: "absolute", top: 4, left: 4, background: "rgba(0,0,0,.7)", color: "#fff", fontSize: 11, padding: "1px 6px", borderRadius: 999 };
