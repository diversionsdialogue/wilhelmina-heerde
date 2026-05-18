import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, ComingSoon } from "@/components/admin/AdminPage";

export const Route = createFileRoute("/_authenticated/admin/nieuws")({
  component: Page,
});

function Page() {
  return (
    <AdminPage title="Nieuws" description="Beheer nieuwsberichten met concepten, geplande publicatie en revisies.">
      <ComingSoon what="Nieuws" />
    </AdminPage>
  );
}
