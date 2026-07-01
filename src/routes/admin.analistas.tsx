import { createFileRoute } from "@tanstack/react-router";
import { AdminStubPage } from "@/components/AdminStubPage";

export const Route = createFileRoute("/admin/analistas")({ component: Page });

function Page() {
  return (
    <AdminStubPage
      eyebrow="Time interno"
      title="Analistas"
      description="Analistas responsáveis por triagem, validação e curadoria manual de editais."
      columns={["Nome", "Especialidade", "Editais atribuídos", "Status"]}
      rows={[
        ["Beatriz Nogueira", "Ciência e Tecnologia", "42", "Ativa"],
        ["Marcelo Prado", "Agro & Bio", "31", "Ativa"],
        ["Renata Cunha", "Energia & Clima", "28", "Ativa"],
        ["Diego Alves", "Saúde", "24", "Férias"],
      ]}
    />
  );
}
