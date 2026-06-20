import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminPage } from "@/components/admin/AdminPage";
import { listUsers, setUserRole, inviteUser } from "@/lib/users.functions";
import { formatDutchDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/gebruikers")({
  component: Page,
});

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #eaeaea",
  borderRadius: 12,
  padding: 24,
  marginBottom: 24,
};
const th: React.CSSProperties = { padding: "10px 12px", fontWeight: 500, fontSize: 12, textTransform: "uppercase", letterSpacing: ".06em", color: "#666", textAlign: "left", borderBottom: "1px solid #eaeaea" };
const td: React.CSSProperties = { padding: "12px", verticalAlign: "middle", borderBottom: "1px solid #f3f3f1", fontSize: 14 };
const btnPrimary: React.CSSProperties = {
  padding: "9px 14px",
  borderRadius: 8,
  background: "#0d0d0d",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 13,
};
const input: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid #d4d4d4",
  fontSize: 14,
  minWidth: 260,
};
const chip = (active: boolean, color = "#0d0d0d"): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  background: active ? color : "#f1f1ef",
  color: active ? "#fff" : "#888",
  cursor: "pointer",
  border: "none",
  userSelect: "none",
});

function Page() {
  const qc = useQueryClient();
  const fetchUsers = useServerFn(listUsers);
  const setRoleFn = useServerFn(setUserRole);
  const inviteFn = useServerFn(inviteUser);

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchUsers(),
  });

  const setRole = useMutation({
    mutationFn: (vars: { userId: string; role: "admin" | "content_manager"; enabled: boolean }) =>
      setRoleFn({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
    onError: (err: Error) => alert(err.message || "Kon rol niet wijzigen"),
  });

  const invite = useMutation({
    mutationFn: (vars: { email: string; password?: string }) => inviteFn({ data: vars }),
    onSuccess: () => {
      setInviteEmail("");
      setInvitePassword("");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => alert(err.message || "Aanmaken mislukt"),
  });

  const [inviteEmail, setInviteEmail] = useState("");

  return (
    <AdminPage
      title="Gebruikers"
      description="Beheer accounts en wijs redactie- of beheerdersrechten toe."
    >
      <div style={card}>
        <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Gebruiker uitnodigen</h2>
        <p style={{ margin: "0 0 14px", color: "#666", fontSize: 13 }}>
          Stuurt een e-mail met een uitnodigingslink. Rollen ken je daarna hieronder toe.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (inviteEmail.trim()) invite.mutate(inviteEmail.trim());
          }}
          style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
        >
          <input
            type="email"
            required
            placeholder="naam@voorbeeld.nl"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            style={input}
          />
          <button type="submit" style={btnPrimary} disabled={invite.isPending}>
            {invite.isPending ? "Versturen…" : "Uitnodigen"}
          </button>
        </form>
      </div>

      <div style={card}>
        <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 600 }}>Gebruikers</h2>

        {usersQuery.isLoading && <p style={{ color: "#666", fontSize: 14 }}>Laden…</p>}
        {usersQuery.error && (
          <p style={{ color: "#b00020", fontSize: 14 }}>
            Kon gebruikers niet ophalen: {(usersQuery.error as Error).message}
          </p>
        )}

        {usersQuery.data && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>E-mail</th>
                  <th style={th}>Aangemaakt</th>
                  <th style={th}>Laatste login</th>
                  <th style={th}>Rollen</th>
                </tr>
              </thead>
              <tbody>
                {usersQuery.data.map((u) => {
                  const isAdmin = u.roles.includes("admin");
                  const isEditor = u.roles.includes("content_manager");
                  const busy = setRole.isPending && setRole.variables?.userId === u.id;
                  return (
                    <tr key={u.id}>
                      <td style={td}>
                        <div style={{ fontWeight: 500 }}>{u.email || <em style={{ color: "#999" }}>geen e-mail</em>}</div>
                      </td>
                      <td style={{ ...td, color: "#666" }}>{formatDutchDate(u.created_at)}</td>
                      <td style={{ ...td, color: "#666" }}>
                        {u.last_sign_in_at ? formatDutchDate(u.last_sign_in_at) : "—"}
                      </td>
                      <td style={td}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              setRole.mutate({
                                userId: u.id,
                                role: "content_manager",
                                enabled: !isEditor,
                              })
                            }
                            style={chip(isEditor, "#2563eb")}
                            title="Redactie: toegang tot alle content, behalve gebruikers, instellingen en redirects."
                          >
                            {isEditor ? "✓ Redactie" : "Redactie"}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              setRole.mutate({
                                userId: u.id,
                                role: "admin",
                                enabled: !isAdmin,
                              })
                            }
                            style={chip(isAdmin, "#0d0d0d")}
                            title="Admin: volledige toegang, inclusief gebruikersbeheer."
                          >
                            {isAdmin ? "✓ Admin" : "Admin"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {usersQuery.data.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ ...td, textAlign: "center", color: "#999" }}>
                      Geen gebruikers gevonden.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ ...card, background: "#faf9f6" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600 }}>Over de rollen</h3>
        <ul style={{ margin: 0, paddingLeft: 18, color: "#555", fontSize: 13, lineHeight: 1.6 }}>
          <li><strong>Redactie</strong> — beheert content (nieuws, agenda, pagina's, beeld en geluid, sponsors, menu, homepage, mailbox, media). Geen toegang tot Gebruikers, Instellingen en Redirects.</li>
          <li><strong>Admin</strong> — volledige toegang, inclusief gebruikersbeheer.</li>
        </ul>
      </div>
    </AdminPage>
  );
}
