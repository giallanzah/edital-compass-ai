import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/PortalShell";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Backoffice · fomenta.ai" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <PortalShell
      title="Backoffice"
      badge="admin"
      rightSlot={
        <span className="hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground md:inline">
          ● sistema operante
        </span>
      }
      items={[
        { to: "/admin", label: "Visão geral" },
        { to: "/admin/editais", label: "Editais" },
        { to: "/admin/scrapers", label: "Scrapers" },
        { to: "/admin/usuarios", label: "Usuários" },
        { to: "/admin/configuracoes", label: "Configurações" },
      ]}
    />
  );
}
