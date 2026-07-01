import { createFileRoute } from "@tanstack/react-router";
import { AdminStubPage } from "@/components/AdminStubPage";

export const Route = createFileRoute("/admin/financeiro")({ component: Page });

function Page() {
  return (
    <AdminStubPage
      eyebrow="Contas a receber"
      title="Financeiro"
      description="Faturas emitidas, ciclo de cobrança e conciliação bancária dos planos ativos."
      columns={["Fatura", "Cliente", "Valor", "Status"]}
      rows={[
        ["INV-2026-0142", "Inovate Tecnologia", "R$ 4.900,00", "Paga"],
        ["INV-2026-0143", "Bioagro Sustentável", "R$ 1.290,00", "Paga"],
        ["INV-2026-0144", "Deeptech AI", "R$ 490,00", "Emitida"],
        ["INV-2026-0145", "Energia Viva", "R$ 1.290,00", "Atrasada"],
        ["INV-2026-0146", "Startup Rural", "R$ 1.290,00", "Emitida"],
      ]}
    />
  );
}
