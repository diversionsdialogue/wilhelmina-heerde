import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminPage } from "@/components/admin/AdminPage";
import { listContactSubmissions, listNewsletterSubscribers } from "@/lib/mailbox.functions";
import { formatDutchDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/mailbox")({
  component: MailboxPage,
});

function MailboxPage() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const fetchList = useServerFn(listContactSubmissions);
  const [openId, setOpenId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["mailbox-contacts", page],
    queryFn: () => fetchList({ data: { page, pageSize } }),
  });

  const totalPages = query.data ? Math.max(1, Math.ceil(query.data.total / pageSize)) : 1;

  return (
    <AdminPage
      title="Mailbox"
      description="Contactformulier-inzendingen en (later) e-mailabonnees."
    >
      <section style={card}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Laatste contactformulieren</h2>
          <span style={{ fontSize: 13, color: "#666" }}>
            {query.data ? `${query.data.total} totaal` : ""}
          </span>
        </header>

        {query.isLoading ? (
          <p style={{ color: "#666", fontSize: 14 }}>Laden…</p>
        ) : query.error ? (
          <p style={{ color: "#b91c1c", fontSize: 14 }}>Kon inzendingen niet laden.</p>
        ) : query.data && query.data.rows.length === 0 ? (
          <p style={{ color: "#666", fontSize: 14 }}>Nog geen inzendingen.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: "left", color: "#666", fontSize: 12, textTransform: "uppercase", letterSpacing: ".05em" }}>
                  <th style={th}>Datum</th>
                  <th style={th}>Naam</th>
                  <th style={th}>E-mail</th>
                  <th style={th}>Bericht</th>
                  <th style={th}>n8n</th>
                </tr>
              </thead>
              <tbody>
                {query.data?.rows.map((r) => {
                  const open = openId === r.id;
                  return (
                    <Fragment key={r.id}>
                      <tr
                        onClick={() => setOpenId(open ? null : r.id)}
                        style={{ borderTop: "1px solid #eee", cursor: "pointer", background: open ? "#fafaf8" : "transparent" }}
                      >
                        <td style={td}>{formatDutchDate(r.created_at)}</td>
                        <td style={td}>{r.first_name} {r.last_name}</td>
                        <td style={td}>
                          <a href={`mailto:${r.email}`} onClick={(e) => e.stopPropagation()} style={{ color: "#0d0d0d" }}>
                            {r.email}
                          </a>
                        </td>
                        <td style={{ ...td, maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.message}
                        </td>
                        <td style={td}>
                          {r.forwarded_to_n8n ? (
                            <span style={{ ...badge, background: "#dcfce7", color: "#166534" }}>OK</span>
                          ) : r.n8n_error ? (
                            <span style={{ ...badge, background: "#fee2e2", color: "#991b1b" }}>Fout</span>
                          ) : (
                            <span style={{ ...badge, background: "#f1f5f9", color: "#475569" }}>—</span>
                          )}
                        </td>
                      </tr>
                      {open && (
                        <tr key={r.id + "-d"} style={{ background: "#fafaf8" }}>
                          <td colSpan={5} style={{ padding: "12px 10px 18px", borderTop: "1px solid #eee" }}>
                            <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
                              {r.phone && <div><strong>Telefoon:</strong> {r.phone}</div>}
                              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{r.message}</div>
                              {r.n8n_error && (
                                <div style={{ color: "#991b1b" }}><strong>n8n-fout:</strong> {r.n8n_error}</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {query.data && query.data.total > pageSize && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={pagerBtn(page <= 1)}
            >
              ← Vorige
            </button>
            <span style={{ fontSize: 13, color: "#666" }}>
              Pagina {page} van {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={pagerBtn(page >= totalPages)}
            >
              Volgende →
            </button>
          </div>
        )}
      </section>

      <NewsletterSection />
    </AdminPage>
  );
}

function NewsletterSection() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const fetchList = useServerFn(listNewsletterSubscribers);

  const query = useQuery({
    queryKey: ["mailbox-newsletter", page],
    queryFn: () => fetchList({ data: { page, pageSize } }),
  });

  const totalPages = query.data ? Math.max(1, Math.ceil(query.data.total / pageSize)) : 1;

  return (
    <section style={{ ...card, marginTop: 20 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>E-mailabonnees</h2>
        <span style={{ fontSize: 13, color: "#666" }}>
          {query.data ? `${query.data.total} totaal` : ""}
        </span>
      </header>

      {query.isLoading ? (
        <p style={{ color: "#666", fontSize: 14 }}>Laden…</p>
      ) : query.error ? (
        <p style={{ color: "#b91c1c", fontSize: 14 }}>Kon abonnees niet laden.</p>
      ) : query.data && query.data.rows.length === 0 ? (
        <p style={{ color: "#666", fontSize: 14 }}>Nog geen aanmeldingen.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#666", fontSize: 12, textTransform: "uppercase", letterSpacing: ".05em" }}>
                <th style={th}>Datum</th>
                <th style={th}>E-mail</th>
                <th style={th}>Bron</th>
                <th style={th}>Brevo</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.rows.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={td}>{formatDutchDate(r.created_at)}</td>
                  <td style={td}>
                    <a href={`mailto:${r.email}`} style={{ color: "#0d0d0d" }}>{r.email}</a>
                  </td>
                  <td style={td}>{r.source ?? "—"}</td>
                  <td style={td}>
                    {r.brevo_synced ? (
                      <span style={{ ...badge, background: "#dcfce7", color: "#166534" }}>OK</span>
                    ) : r.brevo_error ? (
                      <span title={r.brevo_error} style={{ ...badge, background: "#fee2e2", color: "#991b1b" }}>Fout</span>
                    ) : (
                      <span style={{ ...badge, background: "#f1f5f9", color: "#475569" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {query.data && query.data.total > pageSize && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} style={pagerBtn(page <= 1)}>
            ← Vorige
          </button>
          <span style={{ fontSize: 13, color: "#666" }}>
            Pagina {page} van {totalPages}
          </span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={pagerBtn(page >= totalPages)}>
            Volgende →
          </button>
        </div>
      )}
    </section>
  );
}

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e8e8e6",
  borderRadius: 12,
  padding: 20,
};

const th: React.CSSProperties = { padding: "8px 10px", fontWeight: 600 };
const td: React.CSSProperties = { padding: "10px", verticalAlign: "top" };
const badge: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 600,
};

function pagerBtn(disabled: boolean): React.CSSProperties {
  return {
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid #e4e4e4",
    background: disabled ? "#f5f5f5" : "#fff",
    color: disabled ? "#aaa" : "#0d0d0d",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 13,
  };
}
