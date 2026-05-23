import { createFileRoute, useServerFn } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { submitQuickscan } from "@/lib/quickscan.functions";

export const Route = createFileRoute("/quickscan")({
  head: () => ({
    meta: [
      { title: "Muzikale Quickscan — Wilhelmina Heerde" },
      { name: "description", content: "Doe de muzikale quickscan en ontdek welk instrument bij jou past. Voor kinderen, starters en herintreders." },
      { property: "og:title", content: "Muzikale Quickscan — Wilhelmina Heerde" },
      { property: "og:description", content: "Ontdek in een paar klikken welk instrument bij jou past." },
    ],
  }),
  component: QuickscanPage,
});

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const BUCKET_PUBLIC = `${SUPABASE_URL}/storage/v1/object/public/page-media`;

const INSTRUMENTS: { key: string; label: string; thumb?: string }[] = [
  { key: "Slagwerk", label: "Slagwerk", thumb: `${BUCKET_PUBLIC}/slagwerk-mpi9rnt1.webp` },
  { key: "Trompet", label: "Trompet", thumb: `${BUCKET_PUBLIC}/trompet-mpi9ro7o.webp` },
  { key: "Bugel", label: "Bugel", thumb: `${BUCKET_PUBLIC}/bugel-mpi9rott.webp` },
  { key: "Hoorn", label: "Hoorn", thumb: `${BUCKET_PUBLIC}/hoorn-mpi9rney.webp` },
  { key: "Saxofoon", label: "Saxofoon", thumb: `${BUCKET_PUBLIC}/saxofoon-mpi9rnme.webp` },
  { key: "Bariton-Euphonium", label: "Bariton / Euphonium", thumb: `${BUCKET_PUBLIC}/bariton-mpi9roew.webp` },
  { key: "Trombone", label: "Trombone", thumb: `${BUCKET_PUBLIC}/trombone-mpi9ro09.webp` },
  { key: "Bas", label: "Bas", thumb: `${BUCKET_PUBLIC}/bas-mpi9rolu.webp` },
];

const arrow = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
);

type Step = "start" | "experience" | "rejoin" | "instruments" | "exitA" | "exitB" | "done";
type Audience = "kind" | "volwassen";
type Experience = "nee" | "ja";
type RejoinChoice = "zelfde" | "anders";
type Preference = "contact" | "info";

function QuickscanPage() {
  const submit = useServerFn(submitQuickscan);

  const [step, setStep] = useState<Step>("start");
  const [audience, setAudience] = useState<Audience | null>(null);
  const [experience, setExperience] = useState<Experience | null>(null);
  const [prevInstrument, setPrevInstrument] = useState<string | null>(null);
  const [rejoinChoice, setRejoinChoice] = useState<RejoinChoice | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [switcher, setSwitcher] = useState(false);

  const [preference, setPreference] = useState<Preference | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = audience === "volwassen" ? 4 : 3;
  const stepNumber = useMemo(() => {
    switch (step) {
      case "start": return 1;
      case "experience": return 2;
      case "rejoin": return 3;
      case "instruments": return audience === "volwassen" ? 3 : 2;
      case "exitA":
      case "exitB":
      case "done":
        return totalSteps;
    }
  }, [step, audience, totalSteps]);

  function reset() {
    setStep("start");
    setAudience(null); setExperience(null); setPrevInstrument(null);
    setRejoinChoice(null); setChosen(null); setSwitcher(false);
    setPreference(null); setName(""); setPhone(""); setEmail("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!preference || !email) return;
    setSubmitting(true);
    setError(null);
    try {
      await submit({
        data: {
          audience: audience!,
          experience,
          prev_instrument: prevInstrument,
          rejoin_choice: rejoinChoice,
          chosen_instrument: chosen,
          switcher,
          exit_type: step === "exitA" ? "contact" : preference === "contact" ? "proefles" : "info",
          preference,
          name: name || null,
          phone: phone || null,
          email,
        },
      });
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis. Probeer opnieuw.");
    } finally {
      setSubmitting(false);
    }
  }

  const chosenInstrument = INSTRUMENTS.find((i) => i.key === chosen);
  const heroImage = chosenInstrument?.thumb;

  return (
    <SiteLayout>
      <section className="w-qs">
        <div className="w-container">
          <header className="w-qs__head">
            <p className="w-eyebrow">Muzikale quickscan</p>
            <div className="w-qs__progress" aria-hidden="true">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <span key={i} className={`w-qs__dot${i < (stepNumber ?? 0) ? " is-on" : ""}`} />
              ))}
            </div>
          </header>

          {step === "start" && (
            <div className="w-qs__panel">
              <h1 className="w-qs__title">Je bent nooit te jong of te oud om muziek te maken!</h1>
              <p className="w-qs__lead">We hebben voor iedere leeftijd wel een eigen opleiding. Wie gaat er muziek maken?</p>
              <div className="w-qs__choices w-qs__choices--two">
                <button
                  type="button"
                  className="w-qs__choice"
                  onClick={() => { setAudience("kind"); setStep("instruments"); }}
                >
                  <span className="w-qs__choice-title">Ik zoek muziekles voor mijn kind</span>
                  <span className="w-qs__choice-dek">Vanaf ~8 jaar starten we met opleiden in de Wilhelminaband.</span>
                  <span className="w-qs__choice-arrow">{arrow}</span>
                </button>
                <button
                  type="button"
                  className="w-qs__choice"
                  onClick={() => { setAudience("volwassen"); setStep("experience"); }}
                >
                  <span className="w-qs__choice-title">Ik ben een volwassen starter of herintreder (20+)</span>
                  <span className="w-qs__choice-dek">Stap in bij Wilhelmina &amp; Nieuw Talent — voor starters en herintreders.</span>
                  <span className="w-qs__choice-arrow">{arrow}</span>
                </button>
              </div>
            </div>
          )}

          {step === "experience" && (
            <div className="w-qs__panel">
              <h1 className="w-qs__title">Heb je al ervaring?</h1>
              <p className="w-qs__lead">Heb je in het verleden al eens een blaasinstrument of slagwerk bespeeld?</p>
              <div className="w-qs__choices w-qs__choices--two">
                <button
                  type="button"
                  className="w-qs__choice"
                  onClick={() => { setExperience("nee"); setStep("instruments"); }}
                >
                  <span className="w-qs__choice-title">Nee, nog nooit</span>
                  <span className="w-qs__choice-dek">Geen probleem — we beginnen helemaal bij het begin.</span>
                  <span className="w-qs__choice-arrow">{arrow}</span>
                </button>
                <button
                  type="button"
                  className="w-qs__choice"
                  onClick={() => { setExperience("ja"); }}
                >
                  <span className="w-qs__choice-title">Ja, ik heb eerder gespeeld</span>
                  <span className="w-qs__choice-dek">Mooi! Vertel ons welk instrument je bespeelde.</span>
                  <span className="w-qs__choice-arrow">{arrow}</span>
                </button>
              </div>

              {experience === "ja" && (
                <div className="w-qs__subpanel">
                  <h2 className="w-qs__subtitle">Welk instrument heb je bespeeld?</h2>
                  <div className="w-qs__tiles">
                    {INSTRUMENTS.map((i) => (
                      <button
                        key={i.key}
                        type="button"
                        className={`w-qs__tile${prevInstrument === i.key ? " is-active" : ""}`}
                        onClick={() => { setPrevInstrument(i.key); setStep("rejoin"); }}
                      >
                        {i.thumb && <img src={i.thumb} alt="" loading="lazy" />}
                        <span>{i.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <BackButton onClick={() => setStep("start")} />
            </div>
          )}

          {step === "rejoin" && (
            <div className="w-qs__panel">
              <h1 className="w-qs__title">Welkom terug in de muziek!</h1>
              <p className="w-qs__lead">
                Wat leuk dat je vroeger al muziek hebt gemaakt
                {prevInstrument ? ` op de ${prevInstrument.toLowerCase()}` : ""}. Wil je de draad weer oppakken op hetzelfde instrument?
              </p>
              <div className="w-qs__choices w-qs__choices--two">
                <button
                  type="button"
                  className="w-qs__choice"
                  onClick={() => { setRejoinChoice("zelfde"); setChosen(prevInstrument); setSwitcher(false); setStep("exitA"); }}
                >
                  <span className="w-qs__choice-title">Ja, graag!</span>
                  <span className="w-qs__choice-dek">We helpen je snel weer op gang.</span>
                  <span className="w-qs__choice-arrow">{arrow}</span>
                </button>
                <button
                  type="button"
                  className="w-qs__choice"
                  onClick={() => { setRejoinChoice("anders"); setSwitcher(true); setStep("instruments"); }}
                >
                  <span className="w-qs__choice-title">Nee, ik wil wat anders proberen</span>
                  <span className="w-qs__choice-dek">Een nieuw avontuur op een ander instrument.</span>
                  <span className="w-qs__choice-arrow">{arrow}</span>
                </button>
              </div>
              <BackButton onClick={() => setStep("experience")} />
            </div>
          )}

          {step === "instruments" && (
            <div className="w-qs__panel">
              <h1 className="w-qs__title">Welk instrument wil je bespelen?</h1>
              {switcher && <p className="w-qs__lead">Leuk dat je een nieuw avontuur aangaat op een ander instrument!</p>}
              <div className="w-qs__tiles">
                {INSTRUMENTS.map((i) => (
                  <button
                    key={i.key}
                    type="button"
                    className={`w-qs__tile${chosen === i.key ? " is-active" : ""}`}
                    onClick={() => { setChosen(i.key); setStep("exitB"); }}
                  >
                    {i.thumb && <img src={i.thumb} alt="" loading="lazy" />}
                    <span>{i.label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  className={`w-qs__tile w-qs__tile--unknown${chosen === "Onbekend" ? " is-active" : ""}`}
                  onClick={() => { setChosen("Onbekend"); setStep("exitB"); }}
                >
                  <span>Ik weet het nog niet — ik wil eerst uitproberen!</span>
                </button>
              </div>
              <BackButton onClick={() => setStep(audience === "volwassen" ? "experience" : "start")} />
            </div>
          )}

          {(step === "exitA" || step === "exitB") && (
            <div className="w-qs__panel w-qs__panel--exit">
              <div className="w-qs__exit-grid">
                <div className="w-qs__exit-media">
                  {heroImage ? (
                    <img src={heroImage} alt={chosen || ""} />
                  ) : (
                    <div className="w-qs__exit-media-fallback" aria-hidden="true" />
                  )}
                </div>
                <div className="w-qs__exit-copy">
                  <h1 className="w-qs__title">
                    {step === "exitA" ? "Heel goed!" : "Ontdek jouw instrument!"}
                  </h1>
                  <p className="w-qs__lead">
                    {step === "exitA"
                      ? "We helpen je graag weer snel te starten met muziek maken — bijvoorbeeld bij ons Wilhelmina & Nieuw Talent orkest. Wat heeft je voorkeur?"
                      : "Het is altijd persoonlijk welk instrument het beste bij je past. We regelen graag een vrijblijvende proefles of testmoment op het instrument van je voorkeur. Wat heeft je voorkeur?"}
                  </p>

                  <div className="w-qs__choices w-qs__choices--two">
                    <button
                      type="button"
                      className={`w-qs__choice${preference === "contact" ? " is-active" : ""}`}
                      onClick={() => setPreference("contact")}
                    >
                      <span className="w-qs__choice-title">
                        {step === "exitA" ? "Neem contact met mij op" : "Neem contact op voor een proefles"}
                      </span>
                      <span className="w-qs__choice-arrow">{arrow}</span>
                    </button>
                    <button
                      type="button"
                      className={`w-qs__choice${preference === "info" ? " is-active" : ""}`}
                      onClick={() => setPreference("info")}
                    >
                      <span className="w-qs__choice-title">Stuur eerst meer informatie</span>
                      <span className="w-qs__choice-arrow">{arrow}</span>
                    </button>
                  </div>

                  {preference && (
                    <form className="w-qs__form" onSubmit={handleSubmit}>
                      {preference === "contact" && (
                        <>
                          <div className="w-field">
                            <label htmlFor="qs-name">Naam<span className="req">*</span></label>
                            <input id="qs-name" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                          </div>
                          <div className="w-field">
                            <label htmlFor="qs-phone">Telefoonnummer<span className="req">*</span></label>
                            <input id="qs-phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
                          </div>
                        </>
                      )}
                      <div className="w-field">
                        <label htmlFor="qs-email">E-mailadres<span className="req">*</span></label>
                        <input id="qs-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                      </div>
                      {error && <p className="w-qs__error">{error}</p>}
                      <div className="w-qs__form-actions">
                        <button className="w-btn w-btn--primary" type="submit" disabled={submitting}>
                          {submitting ? "Versturen…" : "Verstuur"} {arrow}
                        </button>
                      </div>
                    </form>
                  )}

                  <BackButton onClick={() => setStep(step === "exitA" ? "rejoin" : "instruments")} />
                </div>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="w-qs__panel w-qs__panel--done">
              <h1 className="w-qs__title">Bedankt — we nemen contact op!</h1>
              <p className="w-qs__lead">
                Je aanvraag is verstuurd. Een vrijwilliger van Wilhelmina neemt zo snel mogelijk contact met je op via {email}.
              </p>
              <button type="button" className="w-btn w-btn--secondary" onClick={reset}>Nog een quickscan doen</button>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="w-qs__back" onClick={onClick}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
      Vorige
    </button>
  );
}
