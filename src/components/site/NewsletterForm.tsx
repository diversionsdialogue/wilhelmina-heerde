import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { subscribeNewsletter } from "@/lib/newsletter.functions";

export function NewsletterForm({ source = "homepage" }: { source?: string }) {
  const subscribe = useServerFn(subscribeNewsletter);
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const startedAtRef = useRef<number>(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  return (
    <form
      className="w-news__form"
      suppressHydrationWarning
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (submitting || sent) return;
        setErrorMsg(null);
        const value = email.trim();
        if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          setErrorMsg("Vul een geldig e-mailadres in.");
          return;
        }
        setSubmitting(true);
        try {
          await subscribe({
            data: {
              email: value,
              source,
              website,
              started_at: startedAtRef.current,
            },
          });
          setSent(true);
        } catch (err) {
          setErrorMsg(
            err instanceof Error ? err.message : "Aanmelding mislukt. Probeer het later opnieuw.",
          );
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <input
        className="w-news__input"
        type="email"
        name="email"
        required
        autoComplete="email"
        placeholder="E-mailadres"
        aria-label="E-mailadres"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={submitting || sent}
      />
      {/* Honeypot — verborgen voor mensen, ingevuld door bots */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        style={{ position: "absolute", left: "-10000px", width: 1, height: 1, opacity: 0 }}
        aria-hidden="true"
      />
      <button className="w-news__submit" type="submit" disabled={submitting || sent}>
        {sent ? "Verzonden ✓" : submitting ? "Versturen…" : (
          <>
            Verstuur
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </>
        )}
      </button>
      {errorMsg ? (
        <p role="alert" style={{ gridColumn: "1 / -1", marginTop: 8, color: "hsl(var(--destructive))", fontSize: 13 }}>
          {errorMsg}
        </p>
      ) : null}
    </form>
  );
}
