import { createFileRoute } from "@tanstack/react-router";
import { AdminStubPage } from "@/components/AdminStubPage";

export const Route = createFileRoute("/admin/convenios")({ component: Page });

function Page() {
  return (
    <AdminStubPage
      eyebrow="Instrumentos"
      title="Convênios"
      description="Convênios firmados entre entes públicos e privados vinculados a linhas de fomento."
      columns={["Convênio", "Órgão", "Vigência", "Valor"]}
      rows={[
        ["Convênio CNPq nº 018/2026", "CNPq", "01/26 – 12/28", "R$ 4.8M"],
        ["FAPESP-MCTI Cooperação", "FAPESP", "03/26 – 03/29", "R$ 12.0M"],
        ["FINEP-SEBRAE Tecnova", "FINEP/SEBRAE", "06/25 – 06/27", "R$ 32.0M"],
        ["BNDES-BID Clima", "BNDES", "01/26 – 12/30", "R$ 180M"],
      ]}
    />
  );
}
