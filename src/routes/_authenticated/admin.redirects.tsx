import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, ComingSoon } from "@/components/admin/AdminPage";

export const Route = createFileRoute("/_authenticated/admin/redirects")({
  component: Page,
});

function Page() {
  return (
    <AdminPage title="Redirects" description="Beheer van URL-doorverwijzingen en het 404-rapport.">
      <ComingSoon what="Redirects" />
    </AdminPage>
  );
}
