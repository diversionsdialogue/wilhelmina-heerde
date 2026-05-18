import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Wilhelmina Heerde" },
      { name: "description", content: "Spreek ons aan, kom langs — vragen over concerten, lidmaatschap, boekingen of het leerlingenorkest." },
      { property: "og:title", content: "Contact — Wilhelmina Heerde" },
      { property: "og:description", content: "Vragen over concerten, lidmaatschap of het leerlingenorkest? Neem contact op met het secretariaat." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <SiteLayout>
      <section className="w-contact">
        <div className="w-container">
          <div className="w-contact__grid">
            <div className="w-contact__intro">
              <p className="w-eyebrow">Contact</p>
              <h1 className="w-contact__title">Spreek ons aan, <em>kom langs.</em></h1>
              <p className="w-contact__lead">
                Vragen over een concert, een boeking voor een gelegenheid, lid worden of zelf instromen in het leerlingenorkest? We horen het graag — bel, mail of laat hieronder een bericht achter.
              </p>

              <dl className="w-contact__details">
                <div className="w-contact__detail">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                  <dt>Bezoek- en postadres</dt>
                  <dd>
                    Koninklijk Fanfarekorps Wilhelmina<br />
                    P/a Griftstraat 8<br />
                    8181 VZ Heerde
                    <small>Repetities: maandagavond, Cultuurhuis Heerde</small>
                  </dd>
                </div>
                <div className="w-contact__detail">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z" /></svg>
                  <dt>Telefoon</dt>
                  <dd>
                    <a href="tel:+31623093132">06 — 230 931 32</a>
                    <small>Secretariaat — werkdagen tussen 10:00 en 17:00</small>
                  </dd>
                </div>
                <div className="w-contact__detail">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                  <dt>E-mail</dt>
                  <dd>
                    <a href="mailto:info@wilhelmina-heerde.nl">info@wilhelmina-heerde.nl</a>
                    <small>Voor pers: pers@wilhelmina-heerde.nl</small>
                  </dd>
                </div>
                <div className="w-contact__detail">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" /></svg>
                  <dt>Inschrijving</dt>
                  <dd>
                    KvK 40101836
                    <small>Statutair gevestigd te Heerde · ANBI-status</small>
                  </dd>
                </div>
              </dl>
            </div>

            <form
              className={`w-contact__form${sent ? " is-sent" : ""}`}
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                if (!form.checkValidity()) {
                  form.reportValidity();
                  return;
                }
                // TODO: POST to n8n webhook server function
                setSent(true);
                window.scrollTo({ top: form.offsetTop - 100, behavior: "smooth" });
              }}
              noValidate
            >
              <p className="w-contact__form-eyebrow">Stuur ons een bericht</p>
              <h2 className="w-contact__form-title">Wij nemen binnen twee werkdagen contact op</h2>
              <p className="w-contact__form-dek">
                Velden met <span style={{ color: "var(--w-gold)" }}>*</span> zijn verplicht. Voor concertkaarten verwijzen we naar de bestelpagina van het betreffende concert.
              </p>

              <div className="w-field w-field--row">
                <div className="w-field">
                  <label htmlFor="cf-name">Naam<span className="req">*</span></label>
                  <input id="cf-name" name="name" type="text" required autoComplete="name" placeholder="Uw naam" />
                </div>
                <div className="w-field">
                  <label htmlFor="cf-email">E-mailadres<span className="req">*</span></label>
                  <input id="cf-email" name="email" type="email" required autoComplete="email" placeholder="naam@voorbeeld.nl" />
                </div>
              </div>

              <div className="w-field w-field--row">
                <div className="w-field">
                  <label htmlFor="cf-phone">Telefoon</label>
                  <input id="cf-phone" name="phone" type="tel" autoComplete="tel" placeholder="Optioneel" />
                </div>
                <div className="w-field w-field--select">
                  <label htmlFor="cf-topic">Onderwerp<span className="req">*</span></label>
                  <select id="cf-topic" name="topic" required defaultValue="">
                    <option value="" disabled>Maak een keuze</option>
                    <option>Algemene vraag</option>
                    <option>Concertinformatie</option>
                    <option>Lidmaatschap</option>
                    <option>Leerlingenorkest &amp; opleidingen</option>
                    <option>Boeking / verhuur</option>
                    <option>Steun &amp; sponsoring</option>
                    <option>Pers</option>
                  </select>
                </div>
              </div>

              <div className="w-field">
                <label htmlFor="cf-message">Bericht<span className="req">*</span></label>
                <textarea id="cf-message" name="message" required placeholder="Vertel ons waarmee we kunnen helpen…" />
              </div>

              <label className="w-field--check">
                <input type="checkbox" id="cf-consent" required />
                <span className="box" aria-hidden="true" />
                <span>Ik ga akkoord met de verwerking van mijn gegevens conform de <a href="#">privacyverklaring</a> van Wilhelmina.</span>
              </label>

              <div className="w-contact__form-actions">
                <button className="w-btn w-btn--primary" type="submit">
                  Verstuur bericht
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                </button>
                <small>Of mail rechtstreeks naar info@wilhelmina-heerde.nl</small>
              </div>

              <div className="w-contact__sent" role="status" aria-live="polite">
                <strong>Bedankt</strong>
                Uw bericht is verstuurd. Een lid van het secretariaat neemt binnen twee werkdagen contact met u op.
              </div>
            </form>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
