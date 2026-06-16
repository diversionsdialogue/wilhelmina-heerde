import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AdminPage } from "@/components/admin/AdminPage";
import { optimizeImageForUpload } from "@/lib/optimizeImage";
import { MediaPickerDialog } from "@/components/admin/MediaPickerDialog";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteAgendaItem,
  listAgendaItems,
  upsertAgendaItem,
  type AgendaCategory,
  type AgendaItem,
} from "@/lib/agenda.functions";

export const Route = createFileRoute("/_authenticated/admin/agenda")({
  component: Page,
});

type Draft = {
  id?: string;
  starts_at: string; // local datetime-local format: YYYY-MM-DDTHH:mm
  image_url: string | null;
  category: AgendaCategory;
  location: string;
  title: string;
  description: string;
  hide_on_homepage: boolean;
};

const EMPTY: Draft = {
  starts_at: "",
  image_url: null,
  category: "concert",
  location: "",
  title: "",
  description: "",
  hide_on_homepage: false,
};

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("nl-NL", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Page() {
  const list = useServerFn(listAgendaItems);
  const save = useServerFn(upsertAgendaItem);
  const remove = useServerFn(deleteAgendaItem);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-agenda"],
    queryFn: () => list(),
    enabled: typeof window !== "undefined",
  });

  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const saveMut = useMutation({
    mutationFn: (d: Draft) =>
      save({
        data: {
          id: d.id,
          starts_at: d.starts_at,
          image_url: d.image_url?.trim() || null,
          category: d.category,
          location: d.location.trim() || null,
          title: d.title.trim(),
          description: d.description.trim() || null,
          hide_on_homepage: d.hide_on_homepage,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-agenda"] });
      qc.invalidateQueries({ queryKey: ["upcoming-agenda"] });
      setDraft(EMPTY);
      setErr(null);
    },
    onError: (e: Error) => setErr(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-agenda"] });
      qc.invalidateQueries({ queryKey: ["upcoming-agenda"] });
    },
  });

  function startEdit(item: AgendaItem) {
    setDraft({
      id: item.id,
      starts_at: toLocalInput(item.starts_at),
      image_url: item.image_url,
      category: item.category,
      location: item.location ?? "",
      title: item.title,
      description: item.description ?? "",
      hide_on_homepage: item.hide_on_homepage,
    });
    setErr(null);
  }

  async function onUploadImage(file: File) {
    setErr(null);
    setUploading(true);
    try {
      const { blob, contentType, ext } = await optimizeImageForUpload(file);
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("agenda-media")
        .upload(path, blob, { upsert: false, contentType, cacheControl: "31536000" });
      if (error) throw error;
      const { data } = supabase.storage.from("agenda-media").getPublicUrl(path);
      setDraft((d) => ({ ...d, image_url: data.publicUrl }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload mislukt");
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => setErr(null), [draft.id]);

  return (
    <AdminPage title="Agenda" description="Beheer optredens en evenementen.">
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24 }}>
        {/* List */}
        <section style={card()}>
          <h2 style={h2()}>Agenda-items</h2>
          {query.isLoading && <p style={muted()}>Laden…</p>}
          {query.error && <p style={errStyle()}>Kon agenda niet laden.</p>}
          {query.data && query.data.length === 0 && (
            <p style={muted()}>Nog geen items. Voeg er rechts één toe.</p>
          )}
          <ul style={{ display: "grid", gap: 8, padding: 0, margin: 0, listStyle: "none" }}>
            {query.data?.map((item) => (
              <li
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "72px 1fr auto",
                  gap: 12,
                  alignItems: "center",
                  padding: 10,
                  border: "1px solid #eee",
                  borderRadius: 10,
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 54,
                    background: "#f5f5f5",
                    borderRadius: 6,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span style={{ fontSize: 10, color: "#999" }}>geen</span>
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>
                    {fmtDate(item.starts_at)} · {item.category}
                    {item.location ? ` · ${item.location}` : ""}
                    {item.hide_on_homepage ? " · verborgen op home" : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={btn()} onClick={() => startEdit(item)}>
                    Bewerk
                  </button>
                  <button
                    style={btnDanger()}
                    onClick={() => {
                      if (confirm(`Item "${item.title}" verwijderen?`)) delMut.mutate(item.id);
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
          <h2 style={h2()}>{draft.id ? "Item bewerken" : "Nieuw item"}</h2>

          <Field label="Datum & tijd">
            <input
              type="datetime-local"
              style={input()}
              value={draft.starts_at}
              onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })}
            />
          </Field>

          <Field label="Afbeelding">
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 110,
                  height: 80,
                  background: "#f5f5f5",
                  borderRadius: 8,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: "0 0 auto",
                }}
              >
                {draft.image_url ? (
                  <img
                    src={draft.image_url}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ fontSize: 11, color: "#999" }}>geen</span>
                )}
              </div>
              <div style={{ display: "grid", gap: 6, flex: 1 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <label style={{ ...btn(), display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
                    Uploaden
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void onUploadImage(f);
                      }}
                    />
                  </label>
                  <button type="button" style={btn()} onClick={() => setShowPicker(true)}>
                    Mediabank
                  </button>
                </div>
                <input
                  style={input()}
                  placeholder="…of plak een afbeeldings-URL"
                  value={draft.image_url ?? ""}
                  onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                />
                {uploading && <p style={muted()}>Uploaden…</p>}
              </div>
            </div>
          </Field>

          <Field label="Categorie">
            <select
              style={input()}
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value as AgendaCategory })}
            >
              <option value="concert">Concert</option>
              <option value="educatie">Educatie</option>
              <option value="optreden">Optreden</option>
            </select>
          </Field>

          <Field label="Locatie">
            <input
              style={input()}
              placeholder="bv. Dorpskerk Heerde"
              value={draft.location}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
            />
          </Field>

          <Field label="Titel">
            <input
              style={input()}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </Field>

          <Field label="Toelichting">
            <textarea
              style={{ ...input(), height: 100, padding: 10, resize: "vertical" }}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </Field>

          <Field label="Zichtbaarheid">
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={draft.hide_on_homepage}
                onChange={(e) => setDraft({ ...draft, hide_on_homepage: e.target.checked })}
              />
              <span style={{ fontSize: 13 }}>Verbergen op homepage</span>
            </label>
          </Field>

          {err && <p style={errStyle()}>{err}</p>}

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              style={btnPrimary()}
              disabled={!draft.title.trim() || !draft.starts_at || saveMut.isPending || uploading}
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
      <MediaPickerDialog
        open={showPicker}
        onClose={() => setShowPicker(false)}
        defaultBucket="agenda-media"
        onSelect={(url) => setDraft((d) => ({ ...d, image_url: url }))}
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

const card = (): React.CSSProperties => ({
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: 12,
  padding: 20,
});
const h2 = (): React.CSSProperties => ({ fontSize: 16, fontWeight: 700, margin: "0 0 14px" });
const input = (): React.CSSProperties => ({
  minHeight: 38,
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
