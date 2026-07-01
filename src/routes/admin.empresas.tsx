import { createFileRoute } from "@tanstack/react-router";
import { AdminStubPage } from "@/components/AdminStubPage";

export const Route = createFileRoute("/admin/empresas")({ component: Page });

function Page() {
  return (
    <AdminStubPage
      eyebrow="CRM · pessoas jurídicas"
      title="Empresas"
      description="Cadastro de empresas beneficiárias da plataforma: CNPJ, porte, segmento e plano contratado."
      columns={["Razão social", "CNPJ", "Plano", "Status"]}
      rows={[
        ["Inovate Tecnologia S.A.", "12.345.678/0001-90", "Enterprise", "Ativa"],
        ["Bioagro Sustentável Ltda.", "22.987.654/0001-11", "Pro", "Ativa"],
        ["Deeptech AI ME", "33.111.222/0001-44", "Explorer", "Trial"],
        ["Energia Viva Cooperativa", "44.555.666/0001-77", "Pro", "Ativa"],
        ["Saúde Mais Instituto", "55.888.999/0001-22", "Explorer", "Inadimplente"],
        ["Startup Rural Digital", "66.101.202/0001-33", "Pro", "Ativa"],
      ]}
    />
  );
}
