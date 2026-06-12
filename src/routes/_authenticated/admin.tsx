import { Link, Outlet, useRouter, useRouterState, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMyRole } from "@/lib/auth.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Beheer — Wilhelmina Heerde" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminShell,
});

type NavItem = { to: string; label: string; adminOnly?: boolean };

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Content",
    items: [
      { to: "/admin", label: "Dashboard" },
      { to: "/admin/homepage", label: "Homepage" },
      { to: "/admin/menu", label: "Menu" },
      { to: "/admin/nieuws", label: "Nieuws" },
      { to: "/admin/mailbox", label: "Mailbox" },
      { to: "/admin/beeld-en-geluid", label: "Beeld en geluid" },
      { to: "/admin/agenda", label: "Agenda" },
      { to: "/admin/paginas", label: "Pagina's" },
      { to: "/admin/sponsors", label: "Sponsors" },
      { to: "/admin/media", label: "Media" },
      { to: "/admin/redirects", label: "Redirects" },
    ],
  },
  {
    group: "Beheer",
    items: [
      { to: "/admin/gebruikers", label: "Gebruikers", adminOnly: true },
      { to: "/admin/instellingen", label: "Instellingen", adminOnly: true },
    ],
  },
];

function AdminShell() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fetchRole = useServerFn(getMyRole);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  // Wait for the Supabase session to hydrate before firing any server fn.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) {
        router.navigate({ to: "/login", search: { redirect: "/admin" } as never });
      } else {
        setHasSession(true);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.navigate({ to: "/login" });
      } else {
        setHasSession(true);
        router.invalidate();
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const roleQuery = useQuery({
    queryKey: ["my-role"],
    queryFn: () => fetchRole(),
    enabled: hasSession === true,
  });
  const [collapsed, setCollapsed] = useState(false);


  async function logout() {
    await supabase.auth.signOut();
    router.navigate({ to: "/login" });
  }

  if (hasSession === null || roleQuery.isLoading || roleQuery.isPending) {
    return <FullPageMessage>Laden…</FullPageMessage>;
  }


  if (roleQuery.error || !roleQuery.data) {
    return <FullPageMessage>Kon je toegang niet ophalen. Log opnieuw in.</FullPageMessage>;
  }

  const role = roleQuery.data;

  if (!role.isContentEditor) {
    return (
      <FullPageMessage>
        <strong>Geen toegang.</strong>
        <p style={{ marginTop: 8, color: "#666", fontSize: 14 }}>
          Je bent ingelogd als <code>{role.email}</code>, maar deze account heeft nog geen beheerdersrol.
          Vraag een admin om je rol toe te kennen.
        </p>
        <button onClick={logout} style={btnDark}>Uitloggen</button>
      </FullPageMessage>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f7f7f5", fontFamily: "Inter, system-ui, sans-serif" }}>
      <aside
        style={{
          width: collapsed ? 64 : 240,
          background: "#0d0d0d",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          transition: "width .2s ease",
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
          height: "100vh",
        }}
      >
        <div style={{ padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {!collapsed && (
            <Link to="/admin" style={{ color: "#fff", textDecoration: "none", fontWeight: 700, letterSpacing: ".02em" }}>
              Wilhelmina
              <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.6, letterSpacing: ".15em", textTransform: "uppercase" }}>Beheer</div>
            </Link>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Toggle sidebar"
            style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", padding: 4, fontSize: 18 }}
          >
            {collapsed ? "›" : "‹"}
          </button>
        </div>

        <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
          {NAV.map((group) => {
            const items = group.items.filter((i) => !i.adminOnly || role.isAdmin);
            if (items.length === 0) return null;
            return (
              <div key={group.group} style={{ marginBottom: 18 }}>
                {!collapsed && (
                  <div style={{ padding: "6px 20px", fontSize: 11, textTransform: "uppercase", letterSpacing: ".12em", opacity: 0.5 }}>
                    {group.group}
                  </div>
                )}
                {items.map((item) => {
                  const active = pathname === item.to || (item.to !== "/admin" && pathname.startsWith(item.to));
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      style={{
                        display: "block",
                        padding: collapsed ? "10px 0" : "9px 20px",
                        color: active ? "#fff" : "#bbb",
                        textDecoration: "none",
                        fontSize: 14,
                        background: active ? "rgba(255,255,255,.08)" : "transparent",
                        borderLeft: active ? "3px solid #fff" : "3px solid transparent",
                        textAlign: collapsed ? "center" : "left",
                      }}
                    >
                      {collapsed ? item.label.charAt(0) : item.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,.08)" }}>
          {!collapsed && (
            <div style={{ fontSize: 12, color: "#bbb", marginBottom: 8, wordBreak: "break-all" }}>
              {role.email}
              <div style={{ opacity: 0.6, marginTop: 2 }}>{role.isAdmin ? "Admin" : "Contentbeheerder"}</div>
            </div>
          )}
          <button onClick={logout} style={{ ...btnGhost, width: "100%" }}>
            {collapsed ? "⏻" : "Uitloggen"}
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}

function FullPageMessage({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f7f7f5", padding: 24 }}>
      <div style={{ maxWidth: 420, background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
        {children}
      </div>
    </div>
  );
}

const btnDark: React.CSSProperties = {
  marginTop: 16,
  padding: "10px 16px",
  borderRadius: 999,
  background: "#0d0d0d",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  fontWeight: 600,
};

const btnGhost: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 6,
  background: "transparent",
  color: "#fff",
  border: "1px solid rgba(255,255,255,.2)",
  cursor: "pointer",
  fontSize: 13,
};
