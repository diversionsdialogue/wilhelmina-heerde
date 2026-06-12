import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/site/SiteLayout";
import { submitContact } from "@/lib/contact.functions";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Wilhelmina Heerde" },
      { name: "description", content: "Heb je een vraag of wil je meer informatie over muziek maken bij onze vereniging? Neem contact op met Wilhelmina Heerde." },
      { property: "og:title", content: "Contact met Wilhelmina" },
      { property: "og:description", content: "Heb je een vraag of wil je meer informatie over muziek maken bij onze vereniging? Laat het weten!" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const submit = useServerFn(submitContact);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  return (
    <SiteLayout>
      <section className="w-contact">
        <div className="w-container">
          <header className="w-contact__header">
            <p className="w-eyebrow">Contact</p>
            <h1 className="w-contact__title">Contact met <em>Wilhelmina</em></h1>
            <p className="w-contact__lead">
              Heb je een vraag of wil je meer informatie over muziek maken bij onze vereniging? Laat het weten! We nemen graag contact met je op.
            </p>
          </header>

          <div className="w-contact__split">
            <aside className="w-contact__info">
              <h2 className="w-contact__info-title">Bereik ons</h2>

              <div className="w-contact__info-block">
                <span className="w-contact__info-label">Telefoon</span>
                <a className="w-contact__info-value" href="tel:+31623093132">06 — 230 931 32</a>
              </div>

              <div className="w-contact__info-block">
                <span className="w-contact__info-label">E-mail</span>
                <a className="w-contact__info-value" href="mailto:info@wilhelmina-heerde.nl">info@wilhelmina-heerde.nl</a>
              </div>

              <div className="w-contact__info-block">
                <span className="w-contact__info-label">Repetitielocatie</span>
                <p className="w-contact__info-text">
                  Cultuurhuis Heerde<br />
                  Griftstraat 8<br />
                  8181 VZ Heerde
                </p>
              </div>

              <hr className="w-contact__info-rule" />

              <div className="w-contact__info-block">
                <span className="w-contact__info-label">Repetitietijden</span>
                <dl className="w-contact__hours">
                  <div><dt>A-orkest (donderdag)</dt><dd>19:45 — 22:00</dd></div>
                  <div><dt>Wilhelminaband (vrijdag)</dt><dd>17:30 — 18:15</dd></div>
                  <div><dt>W&amp;NT (zaterdag)</dt><dd>14:00 — 16:30</dd></div>
                </dl>
              </div>

            </aside>

            <form
              className={`w-contact__form${sent ? " is-sent" : ""}`}
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                if (!form.checkValidity()) {
                  form.reportValidity();
                  return;
                }
                if (submitting) return;
                const fd = new FormData(form);
                setSubmitting(true);
                setErrorMsg(null);
                try {
                  await submit({
                    data: {
                      first_name: String(fd.get("first_name") ?? ""),
                      last_name: String(fd.get("last_name") ?? ""),
                      email: String(fd.get("email") ?? ""),
                      phone: String(fd.get("phone") ?? "") || null,
                      message: String(fd.get("message") ?? ""),
                      consent: true,
                      website: String(fd.get("website") ?? ""),
                      started_at: startedAtRef.current,
                    },
                  });
                  setSent(true);
                  window.scrollTo({ top: form.offsetTop - 100, behavior: "smooth" });
                } catch (err) {
                  setErrorMsg(
                    err instanceof Error
                      ? err.message
                      : "Er ging iets mis bij het versturen. Probeer het later opnieuw of mail ons direct.",
                  );
                } finally {
                  setSubmitting(false);
                }
              }}
              noValidate
            >
              {errorMsg && (
                <div className="w-contact__error" role="alert">
                  {errorMsg}
                </div>
              )}
              <div className="w-field w-field--row">
                <div className="w-field">
                  <label htmlFor="cf-first">Voornaam<span className="req">*</span></label>
                  <input id="cf-first" name="first_name" type="text" required autoComplete="given-name" />
                </div>
                <div className="w-field">
                  <label htmlFor="cf-last">Achternaam<span className="req">*</span></label>
                  <input id="cf-last" name="last_name" type="text" required autoComplete="family-name" />
                </div>
              </div>

              <div className="w-field">
                <label htmlFor="cf-email">E-mailadres<span className="req">*</span></label>
                <input id="cf-email" name="email" type="email" required autoComplete="email" />
              </div>

              <div className="w-field">
                <label htmlFor="cf-phone">Telefoon</label>
                <input id="cf-phone" name="phone" type="tel" autoComplete="tel" />
              </div>


              <input type="tel" name="phone" id="cf-phone" autoComplete="tel" hidden style={{ display: "none" }} aria-hidden="true" tabIndex={-1} />
              {/* Honeypot — verborgen veld voor bots */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: "absolute", left: "-10000px", width: 1, height: 1, opacity: 0 }}
              />

              <div className="w-field">
                <label htmlFor="cf-message">Bericht<span className="req">*</span></label>
                <textarea id="cf-message" name="message" required placeholder="Vertel ons waarmee we kunnen helpen…" />
              </div>

              <label className="w-field--check">
                <input type="checkbox" id="cf-consent" name="consent" required />
                <span className="box" aria-hidden="true" />
                <span>Ik ga akkoord met de verwerking van mijn gegevens conform de <a href="#">privacyverklaring</a>.</span>
              </label>

              <div className="w-contact__form-actions">
                <button className="w-btn w-btn--primary w-contact__submit" type="submit" disabled={submitting}>
                  {submitting ? "Verzenden…" : "Verzenden"}
                </button>
              </div>

              <div className="w-contact__sent" role="status" aria-live="polite">
                <strong>Bedankt</strong>
                Je bericht is verstuurd. We nemen binnen twee werkdagen contact met je op.
              </div>
            </form>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
