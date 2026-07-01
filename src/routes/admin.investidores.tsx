import { createFileRoute } from "@tanstack/react-router";
import { AdminStubPage } from "@/components/AdminStubPage";

export const Route = createFileRoute("/admin/investidores")({ component: Page });

function Page() {
  return (
    <AdminStubPage
      eyebrow="Capital"
      title="Investidores"
      description="Fundos, corporate venture, anjos e family offices conectados à plataforma."
      columns={["Investidor", "Tese", "Ticket", "Deals abertos"]}
      rows={[
        ["Kaszek Ventures", "Early-stage LatAm", "US$ 1–5M", "3"],
        ["Astella Investimentos", "SaaS B2B", "R$ 3–15M", "5"],
        ["SP Ventures", "Agtech / Foodtech", "R$ 5–20M", "2"],
        ["BNDESPar", "Deep tech / clima", "R$ 20M+", "4"],
      ]}
    />
  );
}
