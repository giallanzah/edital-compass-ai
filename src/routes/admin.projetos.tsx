import { createFileRoute } from "@tanstack/react-router";
import { AdminStubPage } from "@/components/AdminStubPage";

export const Route = createFileRoute("/admin/projetos")({ component: Page });

function Page() {
  return (
    <AdminStubPage
      eyebrow="Pipeline"
      title="Projetos"
      description="Projetos submetidos pelas empresas: elegibilidade, fase e edital vinculado."
      columns={["Projeto", "Empresa", "Edital", "Fase"]}
      rows={[
        ["Plataforma IoT agrícola", "Bioagro Sustentável", "FINEP Tecnova III", "Submetido"],
        ["Modelo LLM jurídico", "Deeptech AI", "CNPq Universal", "Rascunho"],
        ["Microgrid solar", "Energia Viva", "BNDES Fundo Clima", "Aprovado"],
        ["Prontuário eletrônico", "Saúde Mais", "FAPESP PIPE 1", "Análise"],
        ["Cooperativa 4.0", "Startup Rural", "SEBRAE ALI", "Submetido"],
      ]}
    />
  );
}
