import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AdminPage } from "@/components/admin/AdminPage";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { supabase } from "@/integrations/supabase/client";
import { deletePage, listPages, upsertPage, type PageRow, type PageStatus } from "@/lib/pages.functions";

export const Route = createFileRoute("/_authenticated/admin/paginas")({
  component: Page,
});

type Draft = {
  id?: string;
  slug: string;
  title: string;
  eyebrow: string;
  excerpt: string;
  body_md: string;
  cover_image_url: string | null;
  status: PageStatus;
};

const EMPTY: Draft = {
  slug: "",
  title: "",
  eyebrow: "",
  excerpt: "",
  body_md: "",
  cover_image_url: null,
  status: "draft",
};

type SortKey = "updated_desc" | "updated_asc" | "title_asc" | "title_desc" | "status";

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
  const list = useServerFn(listPages);
  const save = useServerFn(upsertPage);
  const remove = useServerFn(deletePage);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-pages"],
    queryFn: () => list(),
    enabled: typeof window !== "undefined",
  });

  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("updated_desc");

  const filtered = useMemo(() => {
    const items = query.data ?? [];
    const q = search.trim().toLowerCase();
    const out = q
      ? items.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.slug.toLowerCase().includes(q) ||
            (p.excerpt ?? "").toLowerCase().includes(q),
        )
      : items.slice();
    out.sort((a, b) => {
      switch (sort) {
        case "updated_asc":
          return a.updated_at.localeCompare(b.updated_at);
        case "title_asc":
          return a.title.localeCompare(b.title, "nl");
        case "title_desc":
          return b.title.localeCompare(a.title, "nl");
        case "status":
          return a.status.localeCompare(b.status) || b.updated_at.localeCompare(a.updated_at);
        case "updated_desc":
        default:
          return b.updated_at.localeCompare(a.updated_at);
      }
    });
    return out;
  }, [query.data, search, sort]);

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
          status: d.status,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-pages"] });
      setDraft(EMPTY);
      setShowForm(false);
      setErr(null);
    },
    onError: (e: Error) => setErr(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-pages"] }),
  });

  function startEdit(item: PageRow) {
    setDraft({
      id: item.id,
      slug: item.slug,
      title: item.title,
      eyebrow: item.eyebrow ?? "",
      excerpt: item.excerpt ?? "",
      body_md: item.body_md ?? "",
      cover_image_url: item.cover_image_url,
      status: item.status,
    });
    setShowForm(true);
    setErr(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startNew() {
    setDraft(EMPTY);
    setShowForm(true);
    setErr(null);
  }

  async function onUploadImage(file: File) {
    setErr(null);
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("page-media")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("page-media").getPublicUrl(path);
      setDraft((d) => ({ ...d, cover_image_url: data.publicUrl }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload mislukt");
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => setErr(null), [draft.id]);

  return (
    <AdminPage
      title="Pagina's"
      description="Beheer van vrije pagina's zoals Over, Steun, Contact."
      actions={
        <button style={btnPrimary()} onClick={startNew}>
          + Nieuwe pagina
        </button>
      }
    >
      {showForm && (
        <section style={{ ...card(), marginBottom: 20 }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={h2()}>{draft.id ? "Pagina bewerken" : "Nieuwe pagina"}</h2>
            <button
              style={btn()}
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
              <input style={input()} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <Field label="Slug (leeg = automatisch uit titel)">
              <input
                style={input()}
                placeholder="over-ons"
                value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
              />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Eyebrow (optioneel)">
              <input style={input()} value={draft.eyebrow} onChange={(e) => setDraft({ ...draft, eyebrow: e.target.value })} />
            </Field>
            <Field label="Status">
              <select style={input()} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as PageStatus })}>
                <option value="draft">Concept</option>
                <option value="published">Gepubliceerd</option>
              </select>
            </Field>
          </div>

          <Field label="Korte introductie / excerpt">
            <textarea
              style={{ ...input(), height: 64, padding: 10, resize: "vertical" }}
              value={draft.excerpt}
              onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
            />
          </Field>

          <Field label="Cover-afbeelding">
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 140,
                  height: 92,
                  background: "#f5f5f5",
                  borderRadius: 8,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: "0 0 auto",
                }}
              >
                {draft.cover_image_url ? (
                  <img src={draft.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 11, color: "#999" }}>geen</span>
                )}
              </div>
              <div style={{ display: "grid", gap: 6, flex: 1 }}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onUploadImage(f);
                  }}
                />
                <input
                  style={input()}
                  placeholder="…of plak een afbeeldings-URL"
                  value={draft.cover_image_url ?? ""}
                  onChange={(e) => setDraft({ ...draft, cover_image_url: e.target.value })}
                />
                {uploading && <p style={muted()}>Uploaden…</p>}
              </div>
            </div>
          </Field>

          <Field label="Inhoud (Markdown)">
          <Field label="Inhoud (Markdown)">
            <MarkdownEditor
              value={draft.body_md}
              onChange={(v) => setDraft({ ...draft, body_md: v })}
              placeholder={"## Kop\n\nTekst in **Markdown**.\n\n![alt](https://...)\n"}
              textareaStyle={{ ...input(), height: 360, padding: 12, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13, lineHeight: 1.55, resize: "vertical" }}
            />
          </Field>

          {err && <p style={errStyle()}>{err}</p>}

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              style={btnPrimary()}
              disabled={!draft.title.trim() || saveMut.isPending || uploading}
              onClick={() => saveMut.mutate(draft)}
            >
              {saveMut.isPending ? "Opslaan…" : draft.id ? "Wijzigingen opslaan" : "Pagina aanmaken"}
            </button>
          </div>
        </section>
      )}

      <section style={card()}>
        <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <input
            style={{ ...input(), flex: "1 1 240px" }}
            placeholder="Zoek op titel, slug of intro…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select style={{ ...input(), width: 220, flex: "0 0 auto" }} value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="updated_desc">Laatst bijgewerkt (nieuw → oud)</option>
            <option value="updated_asc">Laatst bijgewerkt (oud → nieuw)</option>
            <option value="title_asc">Titel A → Z</option>
            <option value="title_desc">Titel Z → A</option>
            <option value="status">Status</option>
          </select>
        </div>

        {query.isLoading && <p style={muted()}>Laden…</p>}
        {query.error && <p style={errStyle()}>Kon pagina's niet laden.</p>}
        {query.data && filtered.length === 0 && (
          <p style={muted()}>
            {query.data.length === 0 ? "Nog geen pagina's. Klik rechtsboven op " : "Geen pagina's gevonden voor "}
            {query.data.length === 0 ? <strong>+ Nieuwe pagina</strong> : <strong>“{search}”</strong>}.
          </p>
        )}

        {filtered.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#666", borderBottom: "1px solid #eee" }}>
                <th style={th()}>Titel</th>
                <th style={th()}>Slug</th>
                <th style={th()}>Status</th>
                <th style={th()}>Bijgewerkt</th>
                <th style={{ ...th(), textAlign: "right" }}>Acties</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f3f3f3" }}>
                  <td style={td()}>
                    <div style={{ fontWeight: 600, color: "#0d0d0d" }}>{p.title}</div>
                    {p.eyebrow && <div style={{ color: "#888", fontSize: 12 }}>{p.eyebrow}</div>}
                  </td>
                  <td style={{ ...td(), color: "#555", fontFamily: "ui-monospace, monospace" }}>{p.slug}</td>
                  <td style={td()}>
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
                  <td style={{ ...td(), color: "#666" }}>{fmt(p.updated_at)}</td>
                  <td style={{ ...td(), textAlign: "right", whiteSpace: "nowrap" }}>
                    {p.status === "published" && (
                      <a href={`/p/${p.slug}`} target="_blank" rel="noreferrer" style={{ ...btn(), textDecoration: "none", marginRight: 6, display: "inline-block", lineHeight: "30px" }}>
                        Bekijk
                      </a>
                    )}
                    <button style={{ ...btn(), marginRight: 6 }} onClick={() => startEdit(p)}>
                      Bewerk
                    </button>
                    <button
                      style={btnDanger()}
                      onClick={() => {
                        if (confirm(`Pagina "${p.title}" verwijderen?`)) delMut.mutate(p.id);
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

const card = (): React.CSSProperties => ({ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 20 });
const h2 = (): React.CSSProperties => ({ fontSize: 16, fontWeight: 700, margin: 0 });
const input = (): React.CSSProperties => ({ minHeight: 38, padding: "0 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, width: "100%", background: "#fff" });
const btn = (): React.CSSProperties => ({ height: 32, padding: "0 12px", border: "1px solid #ddd", borderRadius: 8, background: "#fff", fontSize: 13, cursor: "pointer", color: "#333" });
const btnPrimary = (): React.CSSProperties => ({ ...btn(), background: "#0d0d0d", color: "#fff", border: "1px solid #0d0d0d", height: 38, padding: "0 18px", fontWeight: 600 });
const btnDanger = (): React.CSSProperties => ({ ...btn(), color: "#b00020", borderColor: "#f1c0c7" });
const muted = (): React.CSSProperties => ({ color: "#888", fontSize: 13, margin: 0 });
const errStyle = (): React.CSSProperties => ({ color: "#b00020", fontSize: 13, margin: "8px 0 0" });
const th = (): React.CSSProperties => ({ padding: "10px 8px", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4 });
const td = (): React.CSSProperties => ({ padding: "12px 8px", verticalAlign: "top" });
