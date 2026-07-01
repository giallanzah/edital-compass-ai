import { createFileRoute } from "@tanstack/react-router";
import { AdminStubPage } from "@/components/AdminStubPage";

export const Route = createFileRoute("/admin/instituicoes")({ component: Page });

function Page() {
  return (
    <AdminStubPage
      eyebrow="Ecossistema"
      title="Instituições"
      description="ICTs, universidades, fundações e órgãos fomentadores cadastrados na plataforma."
      columns={["Instituição", "Tipo", "UF", "Editais"]}
      rows={[
        ["CNPq", "Órgão federal", "DF", "62"],
        ["FINEP", "Órgão federal", "RJ", "48"],
        ["SEBRAE Nacional", "Sistema S", "DF", "31"],
        ["USP", "Universidade", "SP", "22"],
        ["UFRJ", "Universidade", "RJ", "18"],
        ["Embrapii", "ICT", "DF", "14"],
      ]}
    />
  );
}
