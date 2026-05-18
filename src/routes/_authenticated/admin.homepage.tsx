import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, ComingSoon } from "@/components/admin/AdminPage";

export const Route = createFileRoute("/_authenticated/admin/homepage")({
  component: Page,
});

function Page() {
  return (
    <AdminPage title="Homepage" description="Beheer van de blokken op de homepage (hero, promo, sponsors, …).">
      <ComingSoon what="Homepage" />
    </AdminPage>
  );
}
