import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { QuotationsPage } from "@/components/pages/QuotationsPage";

export const Route = createFileRoute("/quotations")({
  head: () => ({
    meta: [
      { title: "Quotations — TimberYard POS" },
      { name: "description", content: "Manage customer quotes and proforma invoices." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AppShell>
        <QuotationsPage />
      </AppShell>
    </RequireAuth>
  ),
});
