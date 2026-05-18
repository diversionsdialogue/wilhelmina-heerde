import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, ComingSoon } from "@/components/admin/AdminPage";

export const Route = createFileRoute("/_authenticated/admin/agenda")({
  component: Page,
});

function Page() {
  return (
    <AdminPage title="Agenda" description="Beheer optredens en evenementen.">
      <ComingSoon what="Agenda" />
    </AdminPage>
  );
}
