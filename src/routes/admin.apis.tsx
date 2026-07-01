import { createFileRoute } from "@tanstack/react-router";
import { AdminStubPage } from "@/components/AdminStubPage";

export const Route = createFileRoute("/admin/apis")({ component: Page });

function Page() {
  return (
    <AdminStubPage
      eyebrow="Desenvolvedores"
      title="APIs"
      description="Chaves de API públicas, escopos e limites de uso dos consumidores da plataforma."
      columns={["Chave", "Cliente", "Escopo", "Requisições (30d)"]}
      rows={[
        ["fai_live_9a2f…", "Inovate Tecnologia", "editais:read", "82,410"],
        ["fai_live_7c8e…", "Deeptech AI", "editais:read, matches:read", "34,218"],
        ["fai_live_4d1b…", "Bioagro", "editais:read", "12,004"],
        ["fai_test_1e9c…", "Playground interno", "*", "1,204"],
      ]}
      cta="+ Nova chave"
    />
  );
}
