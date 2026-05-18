import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, ComingSoon } from "@/components/admin/AdminPage";

export const Route = createFileRoute("/_authenticated/admin/instellingen")({
  component: Page,
});

function Page() {
  return (
    <AdminPage title="Instellingen" description="Algemene instellingen, SEO-defaults en integraties.">
      <ComingSoon what="Instellingen" />
    </AdminPage>
  );
}
