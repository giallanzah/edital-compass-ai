import { createFileRoute, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { meuRole, bootstrapAdmin, registrarEventoAdmin } from "@/lib/admin.functions";
import { Logo } from "@/components/Logo";

type SessionStatus = "checking" | "no_session" | "has_session" | "unauthorized";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Entrar · Backoffice fomenta.ai" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const reason = (routerState.location.search as Record<string, unknown>)?.reason as
    string | undefined;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("checking");

  const meuRoleFn = useServerFn(meuRole);
  const bootstrapAdminFn = useServerFn(bootstrapAdmin);
  const registrarEventoFn = useServerFn(registrarEventoAdmin);

  // Verifica sessão existente ao montar para mostrar estado de carregamento
  // ou redirecionar se já estiver autenticado com role correto
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        setSessionStatus("no_session");
        return;
      }
      try {
        const { isAdmin } = await meuRoleFn();
        if (isAdmin) {
          setSessionStatus("has_session");
          navigate({ to: "/admin" });
        } else {
          setSessionStatus("unauthorized");
        }
      } catch {
        setSessionStatus("unauthorized");
      }
    });
  }, [navigate, meuRoleFn]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      // Verificação do role real (tabela user_roles) antes de liberar acesso.
      let { isAdmin } = await meuRoleFn();

      // Primeiro acesso: se ainda não existe nenhum admin na plataforma, este
      // usuário autenticado se torna SUPER_ADMIN automaticamente (bootstrap_admin
      // é no-op se já existir um admin).
      if (!isAdmin) {
        const { role } = await bootstrapAdminFn();
        isAdmin = role !== null;
      }

      if (!isAdmin) {
        await supabase.auth.signOut();
        throw new Error(
          "Acesso negado. Sua conta não possui perfil ADMIN ou SUPER_ADMIN. Entre em contato com o responsável pela plataforma para solicitar acesso.",
        );
      }

      await registrarEventoFn({
        data: { action: "login", detail: "Login efetuado no backoffice" },
      });
      navigate({ to: "/admin" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao autenticar.");
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left: brand panel */}
      <div className="relative hidden flex-col justify-between bg-foreground p-12 text-background lg:flex">
        <div className="text-background">
          <Logo />
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest opacity-60">
            Backoffice · restrito
          </div>
          <h2 className="mt-4 max-w-md text-3xl font-medium leading-tight tracking-tight">
            Central de operações da plataforma Fomenta.ai
          </h2>
          <p className="mt-4 max-w-md text-sm opacity-70">
            Gestão de editais, empresas, projetos e integrações. Acesso exclusivo para
            administradores autorizados.
          </p>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-widest opacity-50">
          v.1.0 · área administrativa
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center justify-between lg:hidden">
            <Logo />
          </div>

          <div className="eyebrow mb-2">Backoffice</div>
          <h1 className="text-2xl font-medium tracking-tight">Entrar na administração</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acesso restrito a perfis <span className="font-mono">ADMIN</span> ou{" "}
            <span className="font-mono">SUPER_ADMIN</span>.
          </p>

          {/* Estado: verificando sessão existente */}
          {sessionStatus === "checking" && (
            <div className="mt-6 flex items-center gap-3 rounded-sm border border-[var(--hairline)] bg-secondary px-4 py-3">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-foreground" />
              <span className="text-sm text-muted-foreground">Verificando sua sessão…</span>
            </div>
          )}

          {/* Motivo do redirect: sessão expirada ou ausente */}
          {sessionStatus === "no_session" && reason === "no_session" && (
            <div className="mt-6 rounded-sm border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
              Sua sessão expirou ou você não está autenticado. Faça login novamente para continuar.
            </div>
          )}

          {/* Motivo do redirect: role insuficiente */}
          {(sessionStatus === "unauthorized" || reason === "unauthorized") && (
            <div className="mt-6 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <strong className="block mb-1">Acesso negado</strong>
              Sua conta não possui perfil de administrador. O acesso ao backoffice é restrito a
              perfis <span className="font-mono">ADMIN</span> ou{" "}
              <span className="font-mono">SUPER_ADMIN</span>. Entre em contato com o responsável
              pela plataforma para solicitar acesso.
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label className="eyebrow mb-1.5 block">E-mail</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 w-full rounded-sm border border-[var(--hairline)] bg-background px-3 text-sm outline-none focus:border-foreground"
                placeholder="voce@fomenta.ai"
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="eyebrow">Senha</label>
                <Link
                  to="/admin/recuperar-senha"
                  className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 w-full rounded-sm border border-[var(--hairline)] bg-background px-3 text-sm outline-none focus:border-foreground"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-sm border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 w-full items-center justify-center rounded-sm bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <div className="mt-10 text-center">
            <Link
              to="/"
              className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              ← voltar ao site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
