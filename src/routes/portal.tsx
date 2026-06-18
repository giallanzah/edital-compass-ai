import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/PortalShell";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [{ title: "Portal · fomenta.ai" }],
  }),
  component: PortalLayout,
});

function PortalLayout() {
  return (
    <PortalShell
      title="Portal do Empreendedor"
      badge="beta"
      items={[
        { to: "/portal", label: "Dashboard" },
        { to: "/portal/editais", label: "Editais" },
        { to: "/portal/projetos", label: "Meus projetos" },
        { to: "/portal/candidaturas", label: "Candidaturas" },
        { to: "/portal/conhecimento", label: "Base de conhecimento" },
      ]}
    />
  );
}
