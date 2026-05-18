import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, ComingSoon } from "@/components/admin/AdminPage";

export const Route = createFileRoute("/_authenticated/admin/sponsors")({
  component: Page,
});

function Page() {
  return (
    <AdminPage title="Sponsors" description="Beheer van sponsoren — naam, logo, website en zichtbaarheid.">
      <ComingSoon what="Sponsors" />
    </AdminPage>
  );
}
