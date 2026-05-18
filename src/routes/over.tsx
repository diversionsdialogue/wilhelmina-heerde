import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/over")({
  head: () => ({ meta: [{ title: "Over Wilhelmina — Heerde" }, { name: "description", content: "Sinds 1898 het muzikale hart van Heerde. Organisatie, bestuur en geschiedenis." }] }),
  component: OverPage,
});

function OverPage() {
  return (
    <SiteLayout>
      <section className="w-pgheader">
        <div className="w-container">
          <p className="w-eyebrow">Over ons</p>
          <h1 className="w-pgheader__title" style={{ marginTop: 14 }}>Sinds 1898 het muzikale hart van Heerde</h1>
          <p className="w-pgheader__sub">
            Koninklijk Fanfarekorps Wilhelmina is in 1898 opgericht en sindsdien onlosmakelijk verbonden met het dorp. Organisatie, bestuur en geschiedenis worden via het CMS bijgehouden.
          </p>
          <p style={{ marginTop: 24 }}>
            <Link className="w-link-arrow" to="/contact"><span className="w-link-arrow__bar" />Neem contact op</Link>
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
