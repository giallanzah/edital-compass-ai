import { createFileRoute } from "@tanstack/react-router";
import { AdminStubPage } from "@/components/AdminStubPage";

export const Route = createFileRoute("/admin/pagamentos")({ component: Page });

function Page() {
  return (
    <AdminStubPage
      eyebrow="Gateway"
      title="Pagamentos"
      description="Transações processadas via cartão, PIX e boleto — reconciliadas com o provedor."
      columns={["ID", "Método", "Valor", "Status"]}
      rows={[
        ["pay_9f2a1", "Cartão · Visa", "R$ 4.900,00", "Aprovado"],
        ["pay_9f2a2", "PIX", "R$ 1.290,00", "Aprovado"],
        ["pay_9f2a3", "Boleto", "R$ 490,00", "Pendente"],
        ["pay_9f2a4", "Cartão · Master", "R$ 1.290,00", "Recusado"],
        ["pay_9f2a5", "PIX", "R$ 1.290,00", "Aprovado"],
      ]}
    />
  );
}
