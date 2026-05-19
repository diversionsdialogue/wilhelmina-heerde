import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminPage } from "@/components/admin/AdminPage";
import { MediaPickerDialog } from "@/components/admin/MediaPickerDialog";
import {
  getHomeSections,
  updateHomeSection,
  type HeroPayload,
  type BannerPayload,
} from "@/lib/home.functions";

export const Route = createFileRoute("/_authenticated/admin/homepage")({
  component: Page,
});

function Page() {
  const fetchSections = useServerFn(getHomeSections);
  const { data, isLoading, error } = useQuery({
    queryKey: ["home-sections"],
    queryFn: () => fetchSections(),
  });

  return (
    <AdminPage
      title="Homepage"
      description="Beheer de hero en de banner op de homepage. De agenda, het nieuws en de overige blokken worden automatisch gevuld."
    >
      {isLoading && <p style={{ color: "#666" }}>Laden…</p>}
      {error && <ErrorBox>{(error as Error).message}</ErrorBox>}
      {data && (
        <div style={{ display: "grid", gap: 24 }}>
          <HeroEditor initial={data.hero} />
          <ReadOnly title="Binnenkort" text="Wordt automatisch gevuld vanuit Agenda — de eerstvolgende drie items verschijnen hier." />
          <BannerEditor initial={data.banner} />
          <ReadOnly title="Actueel" text="Wordt automatisch gevuld vanuit Nieuws — de drie laatste berichten verschijnen hier." />
          <ReadOnly title="Ontdek / Drie orkesten" text="Vaste inhoud — niet beheerbaar via dit scherm." />
          <ReadOnly title="Steun Wilhelmina & Leerlingenorkest" text="Vaste inhoud — niet beheerbaar via dit scherm." />
        </div>
      )}
    </AdminPage>
  );
}

/* ---------- Hero editor ---------- */

function HeroEditor({ initial }: { initial: HeroPayload }) {
  const [form, setForm] = useState(initial);
  useEffect(() => setForm(initial), [initial]);

  const qc = useQueryClient();
  const update = useServerFn(updateHomeSection);
  const mutation = useMutation({
    mutationFn: () => update({ data: { key: "hero", payload: form } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["home-sections"] }),
  });

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  return (
    <SectionCard
      title="Hero"
      subtitle="De grote kop bovenaan de homepage."
      onSave={() => mutation.mutate()}
      saving={mutation.isPending}
      dirty={dirty}
      saved={mutation.isSuccess && !dirty}
      error={mutation.error ? (mutation.error as Error).message : null}
    >
      <Field label="Pre-titel (eyebrow)" value={form.eyebrow} onChange={(v) => setForm({ ...form, eyebrow: v })} />
      <Field label="Titel" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
      <Field label="Subtitel" value={form.subtitle} onChange={(v) => setForm({ ...form, subtitle: v })} />
      <Field
        label="Introductietekst"
        value={form.text}
        onChange={(v) => setForm({ ...form, text: v })}
        multiline
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 8 }}>
        <Group title="Primaire knop">
          <Field label="Label" value={form.primary_label} onChange={(v) => setForm({ ...form, primary_label: v })} />
          <Field label="Bestemming (URL)" value={form.primary_href} onChange={(v) => setForm({ ...form, primary_href: v })} />
        </Group>
        <Group title="Secundaire knop">
          <Field label="Label" value={form.secondary_label} onChange={(v) => setForm({ ...form, secondary_label: v })} />
          <Field label="Bestemming (URL)" value={form.secondary_href} onChange={(v) => setForm({ ...form, secondary_href: v })} />
        </Group>
      </div>
    </SectionCard>
  );
}

/* ---------- Banner editor ---------- */

function BannerEditor({ initial }: { initial: BannerPayload }) {
  const [form, setForm] = useState(initial);
  useEffect(() => setForm(initial), [initial]);

  const qc = useQueryClient();
  const update = useServerFn(updateHomeSection);
  const mutation = useMutation({
    mutationFn: () => update({ data: { key: "banner", payload: form } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["home-sections"] }),
  });

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  return (
    <SectionCard
      title="Banner"
      subtitle="Het promo-blok onder Binnenkort (bijvoorbeeld het programmaboek)."
      onSave={() => mutation.mutate()}
      saving={mutation.isPending}
      dirty={dirty}
      saved={mutation.isSuccess && !dirty}
      error={mutation.error ? (mutation.error as Error).message : null}
    >
      <Field label="Titel" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
      <Field label="Tekst" value={form.text} onChange={(v) => setForm({ ...form, text: v })} multiline />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 8 }}>
        <Field label="Knoplabel" value={form.button_label} onChange={(v) => setForm({ ...form, button_label: v })} />
        <Field label="Bestemming (URL)" value={form.button_href} onChange={(v) => setForm({ ...form, button_href: v })} />
      </div>
    </SectionCard>
  );
}

/* ---------- shared UI ---------- */

function SectionCard({
  title, subtitle, onSave, saving, dirty, saved, error, children,
}: {
  title: string; subtitle?: string;
  onSave: () => void; saving: boolean; dirty: boolean; saved: boolean;
  error: string | null;
  children: React.ReactNode;
}) {
  return (
    <section style={{ background: "#fff", border: "1px solid #e8e8e6", borderRadius: 12, padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0d0d0d" }}>{title}</h2>
          {subtitle && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#777" }}>{subtitle}</p>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {saved && <span style={{ fontSize: 12, color: "#0a7a3a" }}>✓ Opgeslagen</span>}
          <button
            onClick={onSave}
            disabled={!dirty || saving}
            style={{
              padding: "8px 16px", borderRadius: 999, border: "none",
              background: dirty ? "#0d0d0d" : "#d4d4d4",
              color: "#fff", fontWeight: 600, fontSize: 13,
              cursor: dirty && !saving ? "pointer" : "not-allowed",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Bezig…" : "Opslaan"}
          </button>
        </div>
      </header>
      <div style={{ display: "grid", gap: 14 }}>{children}</div>
      {error && <ErrorBox>{error}</ErrorBox>}
    </section>
  );
}

function Field({
  label, value, onChange, multiline,
}: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  const common = {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    style: {
      width: "100%", padding: "9px 12px", border: "1px solid #d4d4d4",
      borderRadius: 8, fontSize: 14, fontFamily: "inherit", background: "#fff",
    } as React.CSSProperties,
  };
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#444", textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</span>
      {multiline ? <textarea {...common} rows={3} /> : <input type="text" {...common} />}
    </label>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #ececea", borderRadius: 8, padding: 14, background: "#fafaf9" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#0d0d0d", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>{title}</div>
      <div style={{ display: "grid", gap: 10 }}>{children}</div>
    </div>
  );
}

function ReadOnly({ title, text }: { title: string; text: string }) {
  return (
    <section style={{ background: "#fafaf9", border: "1px dashed #d4d4d4", borderRadius: 12, padding: 18 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#0d0d0d", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: "#666" }}>{text}</div>
    </section>
  );
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 12, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: 8, fontSize: 13 }}>
      {children}
    </div>
  );
}
