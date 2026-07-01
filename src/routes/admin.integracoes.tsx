import { createFileRoute } from "@tanstack/react-router";
import { AdminStubPage } from "@/components/AdminStubPage";

export const Route = createFileRoute("/admin/integracoes")({ component: Page });

function Page() {
  return (
    <AdminStubPage
      eyebrow="Ecossistema"
      title="Integrações"
      description="Conectores oficiais com órgãos, ERPs e ferramentas de produtividade."
      columns={["Integração", "Categoria", "Status", "Última sincronização"]}
      rows={[
        ["ComprasNet", "Portal público", "Conectado", "há 12min"],
        ["Slack", "Notificações", "Conectado", "há 4min"],
        ["HubSpot", "CRM", "Conectado", "há 1h"],
        ["Salesforce", "CRM", "Desconectado", "—"],
        ["Google Workspace", "Identidade", "Conectado", "há 2min"],
        ["Zapier", "Automação", "Conectado", "há 20min"],
      ]}
    />
  );
}
