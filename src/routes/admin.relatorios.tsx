import { createFileRoute } from "@tanstack/react-router";
import { AdminStubPage } from "@/components/AdminStubPage";

export const Route = createFileRoute("/admin/relatorios")({ component: Page });

function Page() {
  return (
    <AdminStubPage
      eyebrow="Exportações"
      title="Relatórios"
      description="Relatórios agendados e sob demanda para stakeholders internos e clientes Enterprise."
      columns={["Relatório", "Frequência", "Última execução", "Formato"]}
      rows={[
        ["Editais publicados no mês", "Mensal", "01/07/2026", "PDF"],
        ["Ranking de empresas por match", "Semanal", "29/06/2026", "CSV"],
        ["Uso da IA por cliente", "Diário", "01/07/2026", "JSON"],
        ["Receita e churn", "Mensal", "01/07/2026", "XLSX"],
      ]}
      cta="+ Novo relatório"
    />
  );
}
