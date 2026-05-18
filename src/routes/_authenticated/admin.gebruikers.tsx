import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, ComingSoon } from "@/components/admin/AdminPage";

export const Route = createFileRoute("/_authenticated/admin/gebruikers")({
  component: Page,
});

function Page() {
  return (
    <AdminPage title="Gebruikers" description="Beheer van gebruikersaccounts en rollen.">
      <ComingSoon what="Gebruikers" />
    </AdminPage>
  );
}
