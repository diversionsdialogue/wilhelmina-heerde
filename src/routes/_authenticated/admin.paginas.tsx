import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, ComingSoon } from "@/components/admin/AdminPage";

export const Route = createFileRoute("/_authenticated/admin/paginas")({
  component: Page,
});

function Page() {
  return (
    <AdminPage title="Pagina's" description="Beheer van vrije pagina's zoals Over, Steun, Contact.">
      <ComingSoon what="Pagina's" />
    </AdminPage>
  );
}
