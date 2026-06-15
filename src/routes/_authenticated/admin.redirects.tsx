import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminPage } from "@/components/admin/AdminPage";
import {
  listNotFoundLog,
  deleteNotFoundEntry,
  clearNotFoundLog,
} from "@/lib/not-found-log.functions";
import { listAllRedirects } from "@/lib/redirects";
import { formatDutchDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/redirects")({
  component: Page,
});

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #eaeaea",
  borderRadius: 12,
  padding: 24,
  marginBottom: 24,
};
const th: React.CSSProperties = { padding: "10px 12px", fontWeight: 500 };
const td: React.CSSProperties = { padding: "10px 12px", verticalAlign: "top" };
const btn: React.CSSProperties = {
  fontSize: 13,
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #d4d4d4",
  background: "#fff",
  cursor: "pointer",
};

function Page() {
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const fetchList = useServerFn(listNotFoundLog);
  const deleteEntry = useServerFn(deleteNotFoundEntry);
  const clearAll = useServerFn(clearNotFoundLog);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["not-found-log", page],
    queryFn: () => fetchList({ data: { page, pageSize } }),
  });

  const delMutation = useMutation({
    mutationFn: (id: string) => deleteEntry({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["not-found-log"] }),
  });

  const clearMutation = useMutation({
    mutationFn: () => clearAll(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["not-found-log"] }),
  });

  const totalPages = query.data ? Math.max(1, Math.ceil(query.data.total / pageSize)) : 1;
  const redirects = listAllRedirects();

  return (
    <AdminPage
      title="Redirects & 404-rapport"
      description="Statisch geconfigureerde URL-doorverwijzingen en een logboek van onbekende URLs die bezoekers raken."
    >
      <section style={card}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 14,
          }}
        >
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>404-rapport</h2>
            <p style={{ fontSize: 13, color: "#666", margin: "4px 0 0" }}>
              Onbekende URLs die bezoekers de afgelopen tijd raakten. Voeg veelgevraagde paden
              toe aan <code>src/lib/redirects.ts</code> om ze om te leiden.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ fontSize: 13, color: "#666", alignSelf: "center" }}>
              {query.data ? `${query.data.total} unieke paden` : ""}
            </span>
            {query.data && query.data.total > 0 && (
              <button
                style={btn}
                onClick={() => {
                  if (confirm("Alle 404-entries verwijderen?")) clearMutation.mutate();
                }}
                disabled={clearMutation.isPending}
              >
                Alles wissen
              </button>
            )}
          </div>
        </header>

        {query.isLoading ? (
          <p style={{ color: "#666", fontSize: 14 }}>Laden…</p>
        ) : query.error ? (
          <p style={{ color: "#b91c1c", fontSize: 14 }}>Kon het log niet laden.</p>
        ) : query.data && query.data.rows.length === 0 ? (
          <p style={{ color: "#666", fontSize: 14 }}>Nog geen 404's gelogd.</p>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr
                    style={{
                      textAlign: "left",
                      color: "#666",
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: ".05em",
                    }}
                  >
                    <th style={th}>Pad</th>
                    <th style={th}>Hits</th>
                    <th style={th}>Laatst gezien</th>
                    <th style={th}>Referrer</th>
                    <th style={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {query.data?.rows.map((r) => (
                    <tr key={r.id} style={{ borderTop: "1px solid #eee" }}>
                      <td style={{ ...td, fontFamily: "ui-monospace, monospace" }}>{r.path}</td>
                      <td style={td}>{r.hit_count}</td>
                      <td style={td}>{formatDutchDate(r.last_seen_at)}</td>
                      <td
                        style={{
                          ...td,
                          maxWidth: 280,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: "#666",
                        }}
                        title={r.last_referrer ?? ""}
                      >
                        {r.last_referrer ?? "—"}
                      </td>
                      <td style={td}>
                        <button
                          style={btn}
                          onClick={() => delMutation.mutate(r.id)}
                          disabled={delMutation.isPending}
                        >
                          Verwijderen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
                <button
                  style={btn}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Vorige
                </button>
                <span style={{ fontSize: 13, color: "#666" }}>
                  Pagina {page} van {totalPages}
                </span>
                <button
                  style={btn}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Volgende
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <section style={card}>
        <header style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            Actieve redirects ({redirects.length})
          </h2>
          <p style={{ fontSize: 13, color: "#666", margin: "4px 0 0" }}>
            Read-only weergave. Beheer gebeurt in <code>src/lib/redirects.ts</code>.
          </p>
        </header>
        <div style={{ overflowX: "auto", maxHeight: 420, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead style={{ position: "sticky", top: 0, background: "#fff" }}>
              <tr
                style={{
                  textAlign: "left",
                  color: "#666",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: ".05em",
                }}
              >
                <th style={th}>Van</th>
                <th style={th}>Naar</th>
                <th style={th}>Type</th>
              </tr>
            </thead>
            <tbody>
              {redirects.map((r, i) => (
                <tr key={`${r.kind}-${i}`} style={{ borderTop: "1px solid #eee" }}>
                  <td style={{ ...td, fontFamily: "ui-monospace, monospace" }}>{r.from}</td>
                  <td style={{ ...td, fontFamily: "ui-monospace, monospace" }}>{r.to}</td>
                  <td style={{ ...td, color: "#666" }}>{r.kind}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminPage>
  );
}
