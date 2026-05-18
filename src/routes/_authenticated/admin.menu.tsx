import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, ComingSoon } from "@/components/admin/AdminPage";

export const Route = createFileRoute("/_authenticated/admin/menu")({
  component: Page,
});

function Page() {
  return (
    <AdminPage title="Menu" description="Beheer van de header- en footer-navigatie en de banner in het mega-menu.">
      <ComingSoon what="Menu" />
    </AdminPage>
  );
}
