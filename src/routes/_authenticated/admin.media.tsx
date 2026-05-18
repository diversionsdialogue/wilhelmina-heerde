import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, ComingSoon } from "@/components/admin/AdminPage";

export const Route = createFileRoute("/_authenticated/admin/media")({
  component: Page,
});

function Page() {
  return (
    <AdminPage title="Media" description="Bibliotheek van afbeeldingen en bestanden met automatische optimalisatie.">
      <ComingSoon what="Media" />
    </AdminPage>
  );
}
