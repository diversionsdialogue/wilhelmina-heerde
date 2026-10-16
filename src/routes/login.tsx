import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Inloggen — Wilhelmina Heerde" }, { name: "description", content: "Inloggen voor het beheer van Wilhelmina Heerde." }, { name: "robots", content: "noindex" }, { property: "og:title", content: "Inloggen — Wilhelmina Heerde" }, { property: "og:description", content: "Beheeromgeving van Wilhelmina Heerde." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/admin" });
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/admin" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/admin`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        setMessage({
          kind: "info",
          text: "Account aangemaakt. Controleer je e-mail om je adres te bevestigen, daarna kun je inloggen.",
        });
      }
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Er ging iets mis." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteLayout>
      <section className="w-pgheader">
        <div className="w-container" style={{ maxWidth: 480 }}>
          <p className="w-eyebrow">Beheer</p>
          <h1 className="w-pgheader__title" style={{ marginTop: 14 }}>
            {mode === "signin" ? "Inloggen" : "Account aanmaken"}
          </h1>
          <p className="w-pgheader__sub">
            Toegang voor admin en contentbeheerder.
          </p>

          <form onSubmit={onSubmit} style={{ marginTop: 32, display: "grid", gap: 16 }}>
            {mode === "signup" && (
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Naam</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  style={inputStyle}
                />
              </label>
            )}
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Wachtwoord</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                style={inputStyle}
              />
            </label>

            {message && (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 8,
                  fontSize: 14,
                  background: message.kind === "error" ? "#fef2f2" : "#f0f9ff",
                  color: message.kind === "error" ? "#991b1b" : "#075985",
                  border: `1px solid ${message.kind === "error" ? "#fecaca" : "#bae6fd"}`,
                }}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              style={{
                padding: "12px 18px",
                borderRadius: 999,
                background: "#0d0d0d",
                color: "#fff",
                fontWeight: 600,
                fontSize: 15,
                border: "none",
                cursor: busy ? "wait" : "pointer",
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? "Bezig…" : mode === "signin" ? "Inloggen" : "Account aanmaken"}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setMessage(null);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#555",
                fontSize: 14,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              {mode === "signin" ? "Nog geen account? Maak er een aan." : "Al een account? Log in."}
            </button>
          </form>

          <p style={{ marginTop: 32 }}>
            <Link className="w-link-arrow" to="/">
              <span className="w-link-arrow__bar" />
              Terug naar de site
            </Link>
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #d4d4d4",
  fontSize: 15,
  background: "#fff",
};
