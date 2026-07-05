import { createFileRoute, useNavigate, useRouterState, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/PortalShell";

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

  return (
    <PortalShell
      title="Portal do Empreendedor"
      badge="beta"
      session={session ?? null}
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
