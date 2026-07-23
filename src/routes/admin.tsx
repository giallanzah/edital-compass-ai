import { createFileRoute, Outlet, useRouterState, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/PortalShell";
import { meuRole } from "@/lib/admin.functions";
import { logAudit } from "@/lib/adminAuth";
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
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const isPublic = PUBLIC.some((p) => pathname === p);

  useEffect(() => {
    // Só redireciona quando temos certeza que não há sessão (não durante hidratação)
    if (!isPublic && session === null) {
      navigate({ to: "/admin/login", search: { reason: "no_session" } });
    }
  }, [isPublic, session, navigate]);

  const meuRoleFn = useServerFn(meuRole);
  const roleQ = useQuery({
    queryKey: ["admin", "meu-role"],
    queryFn: () => meuRoleFn(),
    enabled: !isPublic && !!session,
    staleTime: 60_000,
  });

  if (isPublic) {
    return <Outlet />;
  }

  // Estado de carregamento explícito enquanto a sessão está sendo hidratada
  if (session === undefined) {
    return <AdminLoading label="Verificando sessão…" />;
  }

  // Sessão inexistente — o useEffect acima já disparou o redirect;
  // enquanto navega, mantemos o loading para evitar flash de conteúdo protegido
  if (session === null) {
    return <AdminLoading label="Redirecionando para login…" />;
  }

  // Aguarda a confirmação do role real (tabela user_roles) antes de renderizar o backoffice
  if (roleQ.isLoading || roleQ.isFetching) {
    return <AdminLoading label="Verificando permissões…" />;
  }

  if (roleQ.isError || !roleQ.data?.isAdmin) {
    return <AccessDenied email={session.user.email ?? ""} />;
  }

  const highestRole = roleQ.data.roles.includes("SUPER_ADMIN") ? "super_admin" : "admin";

  return (
    <PortalShell
      title="Backoffice"
      badge={highestRole}
      rightSlot={
        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground md:inline">
            ● sistema operante
          </span>
          <button
            onClick={async () => {
              logAudit(session.user.email ?? "", "logout", "Sessão encerrada");
              await supabase.auth.signOut();
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

function AdminLoading({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="flex flex-col items-center gap-4">
        <Logo />
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-foreground" />
          {label}
        </div>
      </div>
    </div>
  );
}

function AccessDenied({ email }: { email: string }) {
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
          A conta <span className="font-mono">{email}</span> não possui perfil ADMIN ou SUPER_ADMIN.
          Solicite acesso ao responsável pela plataforma.
        </p>
        <div className="mt-8 flex justify-center gap-2">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/admin/login", search: { reason: "unauthorized" } });
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
