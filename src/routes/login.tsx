import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Inloggen — Wilhelmina Heerde" }] }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <SiteLayout>
      <section className="w-pgheader">
        <div className="w-container" style={{ maxWidth: 480 }}>
          <p className="w-eyebrow">Beheer</p>
          <h1 className="w-pgheader__title" style={{ marginTop: 14 }}>Inloggen</h1>
          <p className="w-pgheader__sub">
            Toegang voor admin en contentbeheerder. De inlogfunctie wordt in de volgende stap aangesloten op Lovable Cloud.
          </p>
          <p style={{ marginTop: 24 }}>
            <Link className="w-link-arrow" to="/"><span className="w-link-arrow__bar" />Terug naar de site</Link>
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
