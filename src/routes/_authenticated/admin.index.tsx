import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminPage } from "@/components/admin/AdminPage";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

type Period = "today" | "7d" | "30d" | "90d" | "year";

const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Vandaag" },
  { id: "7d", label: "7 dagen" },
  { id: "30d", label: "30 dagen" },
  { id: "90d", label: "90 dagen" },
  { id: "year", label: "Dit jaar" },
];

function Dashboard() {
  const [period, setPeriod] = useState<Period>("30d");
  const queryClient = useQueryClient();

  async function clearCache() {
    if (!confirm("Lokale cache leegmaken en pagina herladen?")) return;
    try {
      queryClient.clear();
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      try {
        sessionStorage.clear();
      } catch {}
    } finally {
      window.location.reload();
    }
  }

  // Dummy data — wordt in stap 2 vervangen door echte cijfers uit page_views-tabel.
  const stats = [
    { label: "Unieke bezoekers", value: "—", delta: null },
    { label: "Paginaweergaves", value: "—", delta: null },
    { label: "Gem. sessieduur", value: "—", delta: null },
    { label: "Bouncepercentage", value: "—", delta: null },
  ];

  return (
    <AdminPage
      title="Dashboard"
      description="Overzicht van bezoekers en activiteit."
      actions={
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={clearCache}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid #e4e4e4",
              background: "#fff",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              color: "#0d0d0d",
            }}
            title="Wist de query-cache, service worker en herlaadt de pagina"
          >
            Cache legen
          </button>
          <div style={{ display: "flex", gap: 4, background: "#fff", border: "1px solid #e4e4e4", borderRadius: 999, padding: 4 }}>
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "none",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  background: period === p.id ? "#0d0d0d" : "transparent",
                  color: period === p.id ? "#fff" : "#555",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {stats.map((s) => (
          <div key={s.label} style={card}>
            <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#0d0d0d" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
              {s.delta ?? "Statistieken volgen in de volgende stap"}
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...card, marginBottom: 24, height: 280, display: "grid", placeItems: "center", color: "#999", fontSize: 14 }}>
        Bezoekersgrafiek — wordt geactiveerd zodra de eigen page_views-tracker draait.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <Panel title="Meest bezochte pagina's">
          <Placeholder lines={5} />
        </Panel>
        <Panel title="Bronnen van verkeer">
          <Placeholder lines={4} />
        </Panel>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Panel title="Apparaten">
          <Placeholder lines={3} />
        </Panel>
        <Panel title="Recente activiteit">
          <Placeholder lines={5} />
        </Panel>
      </div>
    </AdminPage>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#0d0d0d", marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function Placeholder({ lines }: { lines: number }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 12,
            borderRadius: 4,
            background: "linear-gradient(90deg, #f0f0ee 0%, #e6e6e3 50%, #f0f0ee 100%)",
            width: `${50 + ((i * 13) % 45)}%`,
          }}
        />
      ))}
    </div>
  );
}

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e8e8e6",
  borderRadius: 12,
  padding: 20,
};
