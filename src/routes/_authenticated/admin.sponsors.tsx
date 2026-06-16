import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AdminPage } from "@/components/admin/AdminPage";
import { optimizeImageForUpload } from "@/lib/optimizeImage";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteSponsor,
  listSponsors,
  upsertSponsor,
  type Sponsor,
} from "@/lib/sponsors.functions";

export const Route = createFileRoute("/_authenticated/admin/sponsors")({
  component: Page,
});

type Draft = {
  id?: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  sort_order: number;
  is_active: boolean;
};

const EMPTY: Draft = {
  name: "",
  logo_url: null,
  website_url: null,
  sort_order: 0,
  is_active: true,
};

function Page() {
  const list = useServerFn(listSponsors);
  const save = useServerFn(upsertSponsor);
  const remove = useServerFn(deleteSponsor);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-sponsors"],
    queryFn: () => list(),
    enabled: typeof window !== "undefined",
  });

  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const saveMut = useMutation({
    mutationFn: (d: Draft) =>
      save({
        data: {
          id: d.id,
          name: d.name.trim(),
          logo_url: d.logo_url?.trim() || null,
          website_url: d.website_url?.trim() || null,
          sort_order: d.sort_order,
          is_active: d.is_active,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-sponsors"] });
      qc.invalidateQueries({ queryKey: ["public-sponsors"] });
      setDraft(EMPTY);
      setErr(null);
    },
    onError: (e: Error) => setErr(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-sponsors"] });
      qc.invalidateQueries({ queryKey: ["public-sponsors"] });
    },
  });

  function startEdit(s: Sponsor) {
    setDraft({
      id: s.id,
      name: s.name,
      logo_url: s.logo_url,
      website_url: s.website_url,
      sort_order: s.sort_order,
      is_active: s.is_active,
    });
    setErr(null);
  }

  async function onUploadLogo(file: File) {
    setErr(null);
    setUploading(true);
    try {
      const { blob, contentType, ext } = await optimizeImageForUpload(file);
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("sponsor-logos")
        .upload(path, blob, { upsert: false, contentType, cacheControl: "31536000" });
      if (error) throw error;
      const { data } = supabase.storage.from("sponsor-logos").getPublicUrl(path);
      setDraft((d) => ({ ...d, logo_url: data.publicUrl }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload mislukt");
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => setErr(null), [draft.id]);

  return (
    <AdminPage title="Sponsors" description="Beheer sponsors voor de homepage-carrousel.">
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24 }}>
        {/* List */}
        <section style={card()}>
          <h2 style={h2()}>Sponsors</h2>
          {query.isLoading && <p style={muted()}>Laden…</p>}
          {query.error && <p style={errStyle()}>Kon sponsors niet laden.</p>}
          {query.data && query.data.length === 0 && (
            <p style={muted()}>Nog geen sponsors. Voeg er rechts één toe.</p>
          )}
          <ul style={{ display: "grid", gap: 8, padding: 0, margin: 0, listStyle: "none" }}>
            {query.data?.map((s) => (
              <li
                key={s.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "56px 1fr auto",
                  gap: 12,
                  alignItems: "center",
                  padding: 10,
                  border: "1px solid #eee",
                  borderRadius: 10,
                  background: s.is_active ? "#fff" : "#fafafa",
                  opacity: s.is_active ? 1 : 0.65,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 40,
                    background: "#f5f5f5",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {s.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.logo_url}
                      alt={s.name}
                      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                    />
                  ) : (
                    <span style={{ fontSize: 10, color: "#999" }}>geen</span>
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.website_url || "—"} · volgorde {s.sort_order}
                    {!s.is_active && " · verborgen"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={btn()} onClick={() => startEdit(s)}>Bewerk</button>
                  <button
                    style={btnDanger()}
                    onClick={() => {
                      if (confirm(`Sponsor "${s.name}" verwijderen?`)) delMut.mutate(s.id);
                    }}
                  >
                    Verwijder
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Form */}
        <section style={card()}>
          <h2 style={h2()}>{draft.id ? "Sponsor bewerken" : "Nieuwe sponsor"}</h2>

          <Field label="Naam">
            <input
              style={input()}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </Field>

          <Field label="Website (URL)">
            <input
              style={input()}
              placeholder="https://…"
              value={draft.website_url ?? ""}
              onChange={(e) => setDraft({ ...draft, website_url: e.target.value })}
            />
          </Field>

          <Field label="Logo">
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div
                style={{
                  width: 96,
                  height: 64,
                  background: "#f5f5f5",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flex: "0 0 auto",
                }}
              >
                {draft.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={draft.logo_url}
                    alt=""
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                  />
                ) : (
                  <span style={{ fontSize: 11, color: "#999" }}>geen logo</span>
                )}
              </div>
              <div style={{ display: "grid", gap: 6, flex: 1 }}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onUploadLogo(f);
                  }}
                />
                <input
                  style={input()}
                  placeholder="…of plak een logo-URL"
                  value={draft.logo_url ?? ""}
                  onChange={(e) => setDraft({ ...draft, logo_url: e.target.value })}
                />
                {uploading && <p style={muted()}>Uploaden…</p>}
              </div>
            </div>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Volgorde">
              <input
                type="number"
                style={input()}
                value={draft.sort_order}
                onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Zichtbaar">
              <label style={{ display: "flex", alignItems: "center", gap: 8, height: 38 }}>
                <input
                  type="checkbox"
                  checked={draft.is_active}
                  onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
                />
                <span style={{ fontSize: 13 }}>Toon op website</span>
              </label>
            </Field>
          </div>

          {err && <p style={errStyle()}>{err}</p>}

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              style={btnPrimary()}
              disabled={!draft.name.trim() || saveMut.isPending || uploading}
              onClick={() => saveMut.mutate(draft)}
            >
              {saveMut.isPending ? "Opslaan…" : draft.id ? "Wijzigingen opslaan" : "Toevoegen"}
            </button>
            {draft.id && (
              <button style={btn()} onClick={() => setDraft(EMPTY)}>
                Nieuw
              </button>
            )}
          </div>
        </section>
      </div>
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

const card = (): React.CSSProperties => ({
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: 12,
  padding: 20,
});
const h2 = (): React.CSSProperties => ({ fontSize: 16, fontWeight: 700, margin: "0 0 14px" });
const input = (): React.CSSProperties => ({
  height: 38,
  padding: "0 12px",
  border: "1px solid #ddd",
  borderRadius: 8,
  fontSize: 14,
  width: "100%",
  background: "#fff",
});
const btn = (): React.CSSProperties => ({
  height: 32,
  padding: "0 12px",
  border: "1px solid #ddd",
  borderRadius: 8,
  background: "#fff",
  fontSize: 13,
  cursor: "pointer",
});
const btnPrimary = (): React.CSSProperties => ({
  ...btn(),
  background: "#0d0d0d",
  color: "#fff",
  border: "1px solid #0d0d0d",
  height: 38,
  padding: "0 18px",
  fontWeight: 600,
});
const btnDanger = (): React.CSSProperties => ({ ...btn(), color: "#b00020", borderColor: "#f1c0c7" });
const muted = (): React.CSSProperties => ({ color: "#888", fontSize: 13, margin: 0 });
const errStyle = (): React.CSSProperties => ({ color: "#b00020", fontSize: 13, margin: "8px 0 0" });
