import { createFileRoute, Outlet, useRouterState, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { getAdminSession, hasAdminAccess, adminLogout, type AdminSession } from "@/lib/adminAuth";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Backoffice · fomenta.ai" }] }),
  component: AdminLayout,
});

const PUBLIC = ["/admin/login", "/admin/recuperar-senha"];

const MENU = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/empresas", label: "Empresas" },
  { to: "/admin/usuarios", label: "Usuários" },
  { to: "/admin/projetos", label: "Projetos" },
  { to: "/admin/editais", label: "Editais" },
  { to: "/admin/fontes", label: "Fontes do robô" },
  { to: "/admin/coletas", label: "Logs de coleta" },
  { to: "/admin/convenios", label: "Convênios" },
  { to: "/admin/municipios", label: "Municípios" },
  { to: "/admin/estados", label: "Estados" },
  { to: "/admin/instituicoes", label: "Instituições" },
  { to: "/admin/analistas", label: "Analistas" },
  { to: "/admin/investidores", label: "Investidores" },
  { to: "/admin/indicadores", label: "Indicadores" },
  { to: "/admin/relatorios", label: "Relatórios" },
  { to: "/admin/financeiro", label: "Financeiro" },
  { to: "/admin/pagamentos", label: "Pagamentos" },
  { to: "/admin/logs", label: "Logs" },
  { to: "/admin/permissoes", label: "Permissões" },
  { to: "/admin/configuracoes", label: "Configurações" },
  { to: "/admin/ia", label: "IA" },
  { to: "/admin/apis", label: "APIs" },
  { to: "/admin/integracoes", label: "Integrações" },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [session, setSession] = useState<AdminSession | null | undefined>(undefined);

  useEffect(() => {
    setSession(getAdminSession());
  }, [pathname]);

  const isPublic = PUBLIC.some((p) => pathname === p);

  if (isPublic) {
    return <Outlet />;
  }

  if (session === undefined) return null; // hydrating

  if (!session) {
    if (typeof window !== "undefined") {
      navigate({ to: "/admin/login" });
    }
    return null;
  }

  if (!hasAdminAccess(session.role)) {
    return <AccessDenied session={session} />;
  }

  return (
    <PortalShell
      title="Backoffice"
      badge={session.role.toLowerCase()}
      rightSlot={
        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground md:inline">
            ● sistema operante
          </span>
          <button
            onClick={() => {
              adminLogout();
              navigate({ to: "/admin/login" });
            }}
            className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            sair
          </button>
        </div>
      }
      items={MENU}
    />
  );
}

function AccessDenied({ session }: { session: AdminSession }) {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="eyebrow mb-3">403 · acesso negado</div>
        <h1 className="text-3xl font-medium tracking-tight">Sem permissão de administrador</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          A conta <span className="font-mono">{session.email}</span> não possui perfil ADMIN ou
          SUPER_ADMIN. Solicite acesso ao responsável pela plataforma.
        </p>
        <div className="mt-8 flex justify-center gap-2">
          <button
            onClick={() => {
              adminLogout();
              navigate({ to: "/admin/login" });
            }}
            className="inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-sm font-medium text-background"
          >
            Trocar de conta
          </button>
          <Link
            to="/"
            className="inline-flex h-9 items-center rounded-sm hairline px-4 text-sm hover:bg-secondary"
          >
            Voltar ao site
          </Link>
        </div>
      </div>
    </div>
  );
}
