import { createFileRoute, Outlet, useRouterState, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/PortalShell";
import { meuConsultorId } from "@/lib/consultor.functions";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/consultor")({
  head: () => ({ meta: [{ title: "Consultor · fomenta.ai" }] }),
  component: ConsultorLayout,
});

const MENU = [
  { to: "/consultor", label: "Dashboard" },
  { to: "/consultor/clientes", label: "Clientes" },
  { to: "/consultor/atividades", label: "Atividades" },
];

function ConsultorLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === null) {
      navigate({ to: "/portal/login", search: { redirect: pathname } });
    }
  }, [session, pathname, navigate]);

  const meuConsultorFn = useServerFn(meuConsultorId);
  const consultorQ = useQuery({
    queryKey: ["consultor", "meu-registro"],
    queryFn: () => meuConsultorFn(),
    enabled: !!session,
    staleTime: 60_000,
  });

  if (session === undefined) {
    return <ConsultorLoading label="Verificando sessão…" />;
  }
  if (session === null) {
    return <ConsultorLoading label="Redirecionando para login…" />;
  }
  if (consultorQ.isLoading || consultorQ.isFetching) {
    return <ConsultorLoading label="Verificando credencial de consultor…" />;
  }
  if (consultorQ.isError || !consultorQ.data?.ativo) {
    return <AccessDenied email={session.user.email ?? ""} />;
  }

  return (
    <PortalShell
      title="Consultor"
      badge="crm"
      session={session}
      rightSlot={
        <span className="hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground md:inline">
          {consultorQ.data.nome}
        </span>
      }
      items={MENU}
    />
  );
}

function ConsultorLoading({ label }: { label: string }) {
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
        <h1 className="text-3xl font-medium tracking-tight">Sem credencial de consultor</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          A conta <span className="font-mono">{email}</span> não está credenciada (ou está inativa)
          como consultor Fomenta.ai. Solicite ao responsável pela plataforma.
        </p>
        <div className="mt-8 flex justify-center gap-2">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/portal/login" });
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
