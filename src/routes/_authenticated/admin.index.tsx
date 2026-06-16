import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { AdminPage } from "@/components/admin/AdminPage";
import {
  getDashboardStats,
  getViewsTimeseries,
  getTopPages,
  getTrafficSources,
  getDeviceBreakdown,
  getRecentActivity,
  type Period,
} from "@/lib/analytics.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Vandaag" },
  { id: "7d", label: "7 dagen" },
  { id: "30d", label: "30 dagen" },
  { id: "90d", label: "90 dagen" },
  { id: "year", label: "Dit jaar" },
];

function fmtNum(n: number) {
  return n.toLocaleString("nl-NL");
}
function fmtPct(n: number) {
  return `${Math.round(n * 100)}%`;
}
function fmtDelta(cur: number, prev: number): { label: string; positive: boolean | null } {
  if (prev === 0) return { label: cur > 0 ? "nieuw" : "—", positive: cur > 0 ? true : null };
  const diff = (cur - prev) / prev;
  const sign = diff > 0 ? "+" : "";
  return { label: `${sign}${Math.round(diff * 100)}% t.o.v. vorige periode`, positive: diff >= 0 };
}

function Dashboard() {
  const [period, setPeriod] = useState<Period>("30d");
  const queryClient = useQueryClient();

  const statsFn = useServerFn(getDashboardStats);
  const tsFn = useServerFn(getViewsTimeseries);
  const topFn = useServerFn(getTopPages);
  const srcFn = useServerFn(getTrafficSources);
  const devFn = useServerFn(getDeviceBreakdown);
  const recentFn = useServerFn(getRecentActivity);

  const stats = useQuery({ queryKey: ["analytics", "stats", period], queryFn: () => statsFn({ data: { period } }) });
  const ts = useQuery({ queryKey: ["analytics", "ts", period], queryFn: () => tsFn({ data: { period } }) });
  const top = useQuery({ queryKey: ["analytics", "top", period], queryFn: () => topFn({ data: { period } }) });
  const src = useQuery({ queryKey: ["analytics", "src", period], queryFn: () => srcFn({ data: { period } }) });
  const dev = useQuery({ queryKey: ["analytics", "dev", period], queryFn: () => devFn({ data: { period } }) });
  const recent = useQuery({ queryKey: ["analytics", "recent"], queryFn: () => recentFn({}) });

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

  const cur = stats.data?.current;
  const prev = stats.data?.previous;
  const statCards = [
    {
      label: "Unieke bezoekers",
      value: cur ? fmtNum(cur.visitors) : "…",
      delta: cur && prev ? fmtDelta(cur.visitors, prev.visitors) : null,
    },
    {
      label: "Paginaweergaves",
      value: cur ? fmtNum(cur.pageviews) : "…",
      delta: cur && prev ? fmtDelta(cur.pageviews, prev.pageviews) : null,
    },
    {
      label: "Pagina's per sessie",
      value: cur ? cur.avgPerSession.toFixed(1) : "…",
      delta: cur && prev ? fmtDelta(cur.avgPerSession, prev.avgPerSession) : null,
    },
    {
      label: "Bouncepercentage",
      value: cur ? fmtPct(cur.bounce) : "…",
      delta: cur && prev ? fmtDelta(cur.bounce, prev.bounce) : null,
    },
  ];

  const chartData = (ts.data ?? []).map((b) => ({
    label: formatBucket(b.bucket, period),
    Bezoekers: b.visitors,
    Paginaweergaves: b.pageviews,
  }));

  return (
    <AdminPage
      title="Dashboard"
      description="Overzicht van bezoekers en activiteit."
      actions={
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={clearCache} style={btnGhost} title="Wist de query-cache, service worker en herlaadt de pagina">
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
        {statCards.map((s) => (
          <div key={s.label} style={card}>
            <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#0d0d0d" }}>{s.value}</div>
            <div
              style={{
                fontSize: 12,
                marginTop: 4,
                color: s.delta?.positive === null ? "#999" : s.delta?.positive ? "#0a8a4a" : "#c0392b",
              }}
            >
              {s.delta?.label ?? "—"}
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...card, marginBottom: 24, height: 300, padding: 16 }}>
        {chartData.length === 0 ? (
          <div style={{ display: "grid", placeItems: "center", height: "100%", color: "#999", fontSize: 14 }}>
            {ts.isLoading ? "Bezig met laden…" : "Nog geen bezoekers in deze periode."}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gVis" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d0d0d" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#0d0d0d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#666" }} />
              <YAxis tick={{ fontSize: 11, fill: "#666" }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e4e4e4", fontSize: 12 }} />
              <Area type="monotone" dataKey="Bezoekers" stroke="#0d0d0d" fill="url(#gVis)" strokeWidth={2} />
              <Area type="monotone" dataKey="Paginaweergaves" stroke="#888" fill="transparent" strokeWidth={1.5} strokeDasharray="3 3" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <Panel title="Meest bezochte pagina's">
          <List
            loading={top.isLoading}
            items={(top.data ?? []).map((r) => ({
              key: r.path,
              left: r.path,
              right: `${fmtNum(r.pageviews)} (${fmtNum(r.visitors)} uniek)`,
            }))}
          />
        </Panel>
        <Panel title="Bronnen van verkeer">
          <List
            loading={src.isLoading}
            items={(src.data ?? []).map((r) => ({ key: r.source, left: r.source, right: fmtNum(r.count) }))}
          />
        </Panel>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Panel title="Apparaten">
          <List
            loading={dev.isLoading}
            items={(dev.data ?? []).map((r) => ({
              key: r.device,
              left: deviceLabel(r.device),
              right: `${fmtNum(r.count)} · ${fmtPct(r.pct)}`,
            }))}
          />
        </Panel>
        <Panel title="Recente activiteit">
          <List
            loading={recent.isLoading}
            items={(recent.data ?? []).map((r, i) => ({
              key: `${r.created_at}-${i}`,
              left: r.path,
              right: timeAgo(r.created_at),
            }))}
          />
        </Panel>
      </div>
    </AdminPage>
  );
}

function formatBucket(bucket: string, period: Period): string {
  if (period === "today") {
    return bucket.slice(11) + "u";
  }
  const d = new Date(bucket);
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

function deviceLabel(d: string) {
  if (d === "mobile") return "Mobiel";
  if (d === "tablet") return "Tablet";
  return "Desktop";
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s geleden`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m geleden`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}u geleden`;
  const d = Math.floor(h / 24);
  return `${d}d geleden`;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#0d0d0d", marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function List({ loading, items }: { loading: boolean; items: { key: string; left: string; right: string }[] }) {
  if (loading) {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: 12,
              borderRadius: 4,
              background: "linear-gradient(90deg, #f0f0ee 0%, #e6e6e3 50%, #f0f0ee 100%)",
              width: `${60 + i * 5}%`,
            }}
          />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return <div style={{ color: "#999", fontSize: 13 }}>Nog geen data.</div>;
  }
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {items.map((it) => (
        <div key={it.key} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, gap: 12 }}>
          <span style={{ color: "#0d0d0d", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {it.left}
          </span>
          <span style={{ color: "#666", flexShrink: 0 }}>{it.right}</span>
        </div>
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

const btnGhost: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: 999,
  border: "1px solid #e4e4e4",
  background: "#fff",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  color: "#0d0d0d",
};
