import { createFileRoute, useNavigate, useRouterState, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/PortalShell";
import { getMyProfile } from "@/lib/portal.functions";
import { alertasPrazo } from "@/lib/candidatura.functions";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [{ title: "Portal · fomenta.ai" }],
  }),
  component: PortalLayout,
});

// Rotas públicas dentro do portal (catálogo e detalhe).
const PUBLIC_PREFIXES = ["/portal/editais", "/portal/login"];

function isPublic(pathname: string) {
  if (pathname === "/portal/editais") return true;
  if (pathname.startsWith("/portal/editais/")) return true;
  if (pathname === "/portal/login") return true;
  return false;
}

// Rotas onde NÃO forçamos onboarding (a própria página de onboarding e as públicas).
function skipOnboardingGate(pathname: string) {
  if (pathname === "/portal/onboarding") return true;
  if (isPublic(pathname)) return true;
  return false;
}

function PortalLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const publicRoute = isPublic(pathname);

  useEffect(() => {
    if (session === undefined) return;
    if (!publicRoute && !session) {
      navigate({ to: "/portal/login", search: { redirect: pathname } });
    }
  }, [session, publicRoute, pathname, navigate]);

  const perfilFn = useServerFn(getMyProfile);
  const alertasFn = useServerFn(alertasPrazo);

  // Gate de onboarding: só busca perfil quando há sessão e a rota atual precisa dele.
  const perfilQ = useQuery({
    queryKey: ["me", "profile"],
    queryFn: () => perfilFn(),
    enabled: !!session && !skipOnboardingGate(pathname),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!session) return;
    if (skipOnboardingGate(pathname)) return;
    if (perfilQ.isLoading || perfilQ.isFetching) return;
    if (perfilQ.data === null || perfilQ.data === undefined) {
      // Se a query retornou null explicitamente, sem perfil → onboarding
      if (perfilQ.isSuccess && !perfilQ.data) {
        navigate({ to: "/portal/onboarding" });
      }
    }
  }, [session, pathname, perfilQ.isSuccess, perfilQ.isLoading, perfilQ.isFetching, perfilQ.data, navigate]);

  // Alertas de prazo (badge no header).
  const alertasQ = useQuery({
    queryKey: ["me", "alertas-prazo"],
    queryFn: () => alertasFn(),
    enabled: !!session && !publicRoute,
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
  });

  // Página de login usa layout próprio (sem shell)
  if (pathname === "/portal/login") return <Outlet />;

  if (!publicRoute && session === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center text-xs text-muted-foreground">
        Carregando…
      </div>
    );
  }
  if (!publicRoute && !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-xs text-muted-foreground">
        Redirecionando…
      </div>
    );
  }

  const alertasCount = alertasQ.data?.length ?? 0;

  return (
    <PortalShell
      title="Portal do Empreendedor"
      badge="beta"
      session={session ?? null}
      alertasPrazo={alertasCount}
      items={[
        { to: "/portal", label: "Dashboard" },
        { to: "/portal/editais", label: "Editais" },
        { to: "/portal/projetos", label: "Meus projetos" },
        { to: "/portal/candidaturas", label: "Candidaturas" },
        { to: "/portal/perfil", label: "Perfil" },
      ]}
    />
  );
}

// mantido para evitar "no unused" caso alguém referencie
export { PUBLIC_PREFIXES };
