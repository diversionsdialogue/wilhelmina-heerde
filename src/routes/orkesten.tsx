import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

function makeSimplePage(slug: string, title: string, eyebrow: string, lead: string) {
  return function Page() {
    return (
      <SiteLayout>
        <section className="w-pgheader">
          <div className="w-container">
            <p className="w-eyebrow">{eyebrow}</p>
            <h1 className="w-pgheader__title" style={{ marginTop: 14 }}>{title}</h1>
            <p className="w-pgheader__sub">{lead}</p>
            <p style={{ marginTop: 24 }}>
              <Link className="w-link-arrow" to="/contact"><span className="w-link-arrow__bar" />Neem contact op</Link>
            </p>
          </div>
        </section>
      </SiteLayout>
    );
  };
}

export const Route = createFileRoute("/orkesten")({
  head: () => ({ meta: [{ title: "Orkesten — Wilhelmina Heerde" }, { name: "description", content: "Drie orkesten, één traditie: fanfareorkest, slagwerkensemble en leerlingenorkest." }, { property: "og:title", content: "Orkesten — Wilhelmina Heerde" }, { property: "og:description", content: "Drie orkesten, één traditie in Heerde." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: makeSimplePage("orkesten", "Drie orkesten, één traditie", "Orkesten", "Wilhelmina bestaat uit het fanfareorkest, het slagwerkensemble en het leerlingenorkest — samen ruim tachtig musici uit Heerde en omstreken. Deze pagina wordt beheerd via het CMS."),
});
