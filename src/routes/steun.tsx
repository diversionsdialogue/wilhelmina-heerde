import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/steun")({
  head: () => ({ meta: [{ title: "Steun Wilhelmina — Heerde" }, { name: "description", content: "Word vriend van de vereniging en draag bij aan de toekomst van de fanfaretraditie in Heerde." }, { property: "og:title", content: "Steun Wilhelmina — Heerde" }, { property: "og:description", content: "Draag bij aan de toekomst van de fanfaretraditie in Heerde." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: SteunPage,
});

function SteunPage() {
  return (
    <SiteLayout>
      <section className="w-pgheader">
        <div className="w-container">
          <p className="w-eyebrow">Steun ons</p>
          <h1 className="w-pgheader__title" style={{ marginTop: 14 }}>Word vriend van Wilhelmina</h1>
          <p className="w-pgheader__sub">
            Draag bij aan de toekomst van de fanfaretraditie in Heerde — sinds 1898. Vriend worden, doneren of als sponsor verbinden: alle informatie staat hieronder.
          </p>
          <p style={{ marginTop: 24 }}>
            <Link className="w-link-arrow" to="/contact"><span className="w-link-arrow__bar" />Word vriend</Link>
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
