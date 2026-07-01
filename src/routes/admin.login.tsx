import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { adminLogin } from "@/lib/adminAuth";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Entrar · Backoffice fomenta.ai" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@fomenta.ai");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      adminLogin(email, password);
      navigate({ to: "/admin" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao autenticar.");
    } finally {
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

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label className="eyebrow mb-1.5 block">E-mail</label>
              <input
                type="email"
                required
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

            <div className="rounded-sm bg-secondary p-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
              DEMO ·<br />
              super_admin: admin@fomenta.ai / admin123<br />
              admin: ana@fomenta.ai / ana123<br />
              sem acesso: viewer@fomenta.ai / viewer123
            </div>
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
