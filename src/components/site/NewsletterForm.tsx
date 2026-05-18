import { useState } from "react";

export function NewsletterForm() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <form
      className="w-news__form"
      suppressHydrationWarning
      onSubmit={(e) => {
        e.preventDefault();
        // TODO: POST to n8n webhook (server function) — wired later
        setSubmitted(true);
      }}
    >
      <input
        className="w-news__input"
        type="email"
        required
        placeholder="E-mailadres"
        aria-label="E-mailadres"
        disabled={submitted}
      />
      <button className="w-news__submit" type="submit" disabled={submitted}>
        {submitted ? "Verzonden ✓" : (
          <>
            Verstuur
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </>
        )}
      </button>
    </form>
  );
}
