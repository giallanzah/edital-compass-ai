import { createFileRoute } from "@tanstack/react-router";
import { AdminStubPage } from "@/components/AdminStubPage";

export const Route = createFileRoute("/admin/estados")({ component: Page });

function Page() {
  return (
    <AdminStubPage
      eyebrow="Geografia"
      title="Estados"
      description="27 unidades da federação com editais estaduais, FAPs e programas próprios."
      columns={["Estado", "UF", "FAP", "Editais ativos"]}
      rows={[
        ["São Paulo", "SP", "FAPESP", "82"],
        ["Rio de Janeiro", "RJ", "FAPERJ", "51"],
        ["Minas Gerais", "MG", "FAPEMIG", "48"],
        ["Rio Grande do Sul", "RS", "FAPERGS", "33"],
        ["Paraná", "PR", "Fundação Araucária", "29"],
        ["Distrito Federal", "DF", "FAPDF", "24"],
      ]}
    />
  );
}
