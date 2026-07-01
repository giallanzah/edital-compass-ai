import { createFileRoute } from "@tanstack/react-router";
import { AdminStubPage } from "@/components/AdminStubPage";

export const Route = createFileRoute("/admin/municipios")({ component: Page });

function Page() {
  return (
    <AdminStubPage
      eyebrow="Geografia"
      title="Municípios"
      description="Base de municípios brasileiros para segmentação regional de editais e programas."
      columns={["Município", "UF", "IBGE", "Editais ativos"]}
      rows={[
        ["São Paulo", "SP", "3550308", "128"],
        ["Rio de Janeiro", "RJ", "3304557", "87"],
        ["Belo Horizonte", "MG", "3106200", "54"],
        ["Porto Alegre", "RS", "4314902", "41"],
        ["Curitiba", "PR", "4106902", "37"],
        ["Recife", "PE", "2611606", "29"],
      ]}
    />
  );
}
