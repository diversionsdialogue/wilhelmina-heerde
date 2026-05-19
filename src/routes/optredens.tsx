import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { NewsletterBand } from "@/components/site/NewsletterBand";
import { listPublicAgenda, type AgendaItem } from "@/lib/agenda.functions";

export const Route = createFileRoute("/optredens")({
  head: () => ({
    meta: [
      { title: "Agenda — Wilhelmina Heerde" },
      { name: "description", content: "Het hele jaar muziek: concerten en optredens in en rondom Heerde. Mis niets." },
      { property: "og:title", content: "Agenda — Wilhelmina Heerde" },
      { property: "og:description", content: "Het hele jaar muziek: concerten en optredens in en rondom Heerde. Mis niets." },
    ],
  }),
  component: OptredensPage,
});

const arrow = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
);

const MONTHS = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
const DAYS = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];

function categoryLabel(cat: AgendaItem["category"]) {
  if (cat === "concert") return "Concert";
  if (cat === "educatie") return "Educatie";
  return "Optreden";
}

function groupByMonth(items: AgendaItem[]) {
  const map = new Map<string, AgendaItem[]>();
  for (const item of items) {
    const d = new Date(item.starts_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const arr = map.get(key) ?? [];
    arr.push(item);
    map.set(key, arr);
  }
  return Array.from(map.entries()).map(([key, rows]) => {
    const [y, m] = key.split("-").map(Number);
    const label = `${MONTHS[m].charAt(0).toUpperCase() + MONTHS[m].slice(1)} ${y}`;
    const count =
      rows.length === 1 ? "één agendapunt" : `${rows.length} agendapunten`;
    return { key, label, count, rows };
  });
}

function OptredensPage() {
  const fetchAgenda = useServerFn(listPublicAgenda);
  const { data, isLoading, error } = useQuery({
    queryKey: ["public-agenda"],
    queryFn: () => fetchAgenda(),
    staleTime: 60_000,
  });

  const groups = groupByMonth(data ?? []);

  return (
    <SiteLayout>
      <section className="w-pgheader">
        <div className="w-container">
          <h1 className="w-pgheader__title">Agenda</h1>
          <p className="w-pgheader__sub">
            Het hele jaar muziek: concerten en optredens in en rondom Heerde. Mis niets.
          </p>
        </div>
      </section>

      <section className="w-agenda">
        <div className="w-container">
          {isLoading && <p style={{ color: "#888" }}>Agenda laden…</p>}
          {error && <p style={{ color: "#b00020" }}>Kon de agenda niet laden.</p>}
          {!isLoading && !error && groups.length === 0 && (
            <p style={{ color: "#888" }}>Er staan op dit moment geen geplande optredens in de agenda.</p>
          )}
          {groups.map((g) => (
            <div className="w-agenda__group" key={g.key}>
              <h2 className="w-agenda__month">{g.label} <em>{g.count}</em></h2>
              <ul className="w-agenda__list">
                {g.rows.map((r) => {
                  const d = new Date(r.starts_at);
                  const day = DAYS[d.getDay()];
                  const num = String(d.getDate()).padStart(2, "0");
                  const time = d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
                  return (
                    <li key={r.id} className="w-agenda__row">
                      <div className="w-agenda__date">
                        <span className="w-agenda__date-day">{day}</span>
                        <span className="w-agenda__date-num">{num}</span>
                      </div>
                      <div className="w-agenda__thumb">
                        {r.image_url ? (
                          <img
                            src={r.image_url}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        ) : (
                          <span className="ph ph--strings" aria-hidden="true" />
                        )}
                      </div>
                      <div className="w-agenda__body">
                        <p className="w-agenda__meta">
                          <span>{time}</span>
                          <span className="w-agenda__meta-dot" aria-hidden="true" />
                          <span>{categoryLabel(r.category)}</span>
                          {r.location && (
                            <>
                              <span className="w-agenda__meta-dot" aria-hidden="true" />
                              <span>{r.location}</span>
                            </>
                          )}
                        </p>
                        <h3 className="w-agenda__title">{r.title}</h3>
                        {r.description && <p className="w-agenda__dek">{r.description}</p>}
                      </div>
                      <div className="w-agenda__actions">
                        {!r.hide_on_homepage && (
                          <a className="w-btn w-btn--primary" href="#nieuwsbrief">
                            Blijf op de hoogte {arrow}
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <NewsletterBand />
    </SiteLayout>
  );
}
