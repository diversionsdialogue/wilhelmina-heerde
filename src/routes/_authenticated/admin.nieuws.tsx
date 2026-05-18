import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin/AdminPage";

export const Route = createFileRoute("/_authenticated/admin/nieuws")({
  component: Page,
});

function Page() {
  return (
    <AdminPage
      title="Nieuws"
      description="Beheer nieuwsberichten. Editor met concepten en revisies volgt; importeren kan al."
      actions={
        <Link
          to="/admin/nieuws/import"
          style={{
            background: "#0d0d0d",
            color: "#fff",
            padding: "10px 18px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Markdown importeren
        </Link>
      }
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          padding: 32,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>
          Bulk-import vanuit Markdown
        </h2>
        <p style={{ margin: "0 0 8px", color: "#555", fontSize: 14, lineHeight: 1.6 }}>
          Upload één of meer <code>.md</code>-bestanden samen met de bijbehorende
          afbeeldingen. De importer:
        </p>
        <ul style={{ margin: 0, paddingLeft: 20, color: "#555", fontSize: 14, lineHeight: 1.8 }}>
          <li>leest <code>title</code>, <code>slug</code> en <code>date</code> uit de frontmatter;</li>
          <li>vervangt alle <code>![alt](pad.jpg)</code>-referenties door publieke URLs;</li>
          <li>gebruikt de eerste afbeelding als header en haalt die uit de body;</li>
          <li>slaat berichten met een bestaande slug over (veilig).</li>
        </ul>
      </div>
    </AdminPage>
  );
}
