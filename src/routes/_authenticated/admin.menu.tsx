import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AdminPage } from "@/components/admin/AdminPage";
import { optimizeImageForUpload } from "@/lib/optimizeImage";
import { supabase } from "@/integrations/supabase/client";
import { getMenuBanner, updateMenuBanner, type MenuBannerPayload } from "@/lib/menu.functions";

export const Route = createFileRoute("/_authenticated/admin/menu")({
  component: Page,
});

const EMPTY: MenuBannerPayload = { image_url: "", title: "", cta_label: "", href: "" };

function Page() {
  const get = useServerFn(getMenuBanner);
  const save = useServerFn(updateMenuBanner);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-menu-banner"],
    queryFn: () => get(),
    enabled: typeof window !== "undefined",
  });

  const [draft, setDraft] = useState<MenuBannerPayload>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (query.data) setDraft(query.data);
  }, [query.data]);

  const saveMut = useMutation({
    mutationFn: (d: MenuBannerPayload) =>
      save({
        data: {
          image_url: d.image_url.trim(),
          title: d.title.trim(),
          cta_label: d.cta_label.trim(),
          href: d.href.trim(),
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-menu-banner"] });
      qc.invalidateQueries({ queryKey: ["menu-banner"] });
      setErr(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (e: Error) => setErr(e.message),
  });

  async function onUploadImage(file: File) {
    setErr(null);
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("menu-media")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("menu-media").getPublicUrl(path);
      setDraft((d) => ({ ...d, image_url: data.publicUrl }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload mislukt");
    } finally {
      setUploading(false);
    }
  }

  return (
    <AdminPage title="Menu" description="Beheer de banner (afbeelding, kop, CTA en bestemming) in het hoofdmenu.">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <section style={card()}>
          <h2 style={h2()}>Banner</h2>
          {query.isLoading && <p style={muted()}>Laden…</p>}

          <Field label="Afbeelding">
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 140,
                  height: 100,
                  background: "#f5f5f5",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
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
                  <span style={{ fontSize: 11, color: "#999" }}>geen afbeelding</span>
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
                  value={draft.image_url}
                  onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                />
                {uploading && <p style={muted()}>Uploaden…</p>}
              </div>
            </div>
          </Field>

          <Field label="Kop">
            <input
              style={input()}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </Field>

          <Field label="CTA-tekst">
            <input
              style={input()}
              placeholder="bv. Start direct"
              value={draft.cta_label}
              onChange={(e) => setDraft({ ...draft, cta_label: e.target.value })}
            />
          </Field>

          <Field label="URL (bestemming)">
            <input
              style={input()}
              placeholder="/orkesten of https://…"
              value={draft.href}
              onChange={(e) => setDraft({ ...draft, href: e.target.value })}
            />
          </Field>

          {err && <p style={errStyle()}>{err}</p>}
          {saved && <p style={{ color: "#0a7a2a", fontSize: 13, margin: "8px 0 0" }}>Opgeslagen.</p>}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              style={btnPrimary()}
              disabled={!draft.title.trim() || saveMut.isPending || uploading}
              onClick={() => saveMut.mutate(draft)}
            >
              {saveMut.isPending ? "Opslaan…" : "Wijzigingen opslaan"}
            </button>
          </div>
        </section>

        <section style={card()}>
          <h2 style={h2()}>Voorbeeld</h2>
          <p style={muted()}>Zo verschijnt de banner in het mega-menu.</p>
          <div
            style={{
              marginTop: 12,
              border: "1px solid #eee",
              borderRadius: 12,
              padding: 14,
              background: "#fafafa",
            }}
          >
            <div
              style={{
                width: "100%",
                aspectRatio: "4 / 3",
                borderRadius: 8,
                background: draft.image_url
                  ? `center/cover no-repeat url(${JSON.stringify(draft.image_url)})`
                  : "#e8e3da",
              }}
            />
            <div style={{ marginTop: 12, fontWeight: 700, fontSize: 18 }}>
              {draft.title || "—"}
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: "#9B804A" }}>
              {draft.cta_label || "—"} →
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: "#888" }}>
              bestemming: {draft.href || "—"}
            </div>
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
const btnPrimary = (): React.CSSProperties => ({
  height: 38,
  padding: "0 18px",
  border: "1px solid #0d0d0d",
  borderRadius: 8,
  background: "#0d0d0d",
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
});
const muted = (): React.CSSProperties => ({ color: "#888", fontSize: 13, margin: 0 });
const errStyle = (): React.CSSProperties => ({ color: "#b00020", fontSize: 13, margin: "8px 0 0" });
