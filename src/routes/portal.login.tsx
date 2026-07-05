import { createFileRoute, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/portal/login")({
  head: () => ({ meta: [{ title: "Entrar · fomenta.ai" }] }),
  component: PortalLogin,
});

function PortalLogin() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ tone: "err" | "ok"; text: string } | null>(null);
  const navigate = useNavigate();

  const search = useRouterState({ select: (s) => s.location.search }) as unknown as Record<string, unknown>;
  const redirectTo = typeof search?.redirect === "string" ? (search.redirect as string) : "/portal";

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirectTo });
    });
  }, [navigate, redirectTo]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: typeof window !== "undefined" ? window.location.origin + "/portal" : undefined,
            data: { full_name: nome },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setMsg({
            tone: "ok",
            text: "Conta criada. Confirme o email para acessar o portal.",
          });
          return;
        }
        navigate({ to: "/portal/onboarding" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: redirectTo });
      }
    } catch (err) {
      setMsg({ tone: "err", text: err instanceof Error ? err.message : "Erro." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 md:grid-cols-2">
        <div className="hidden flex-col justify-between p-10 hairline-r md:flex">
          <Link to="/">
            <Logo />
          </Link>
          <div>
            <div className="eyebrow mb-3">Portal do Empreendedor</div>
            <h1 className="text-3xl font-medium tracking-tight">
              Encontre editais que combinam com sua empresa.
            </h1>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Cadastro em minutos. Match score com base no seu setor, porte e temas de interesse.
            </p>
          </div>
          <div className="font-mono text-[11px] text-muted-foreground">© 2026 fomenta.ai</div>
        </div>

        <div className="flex items-center justify-center p-8">
          <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
            <div>
              <div className="eyebrow mb-2">{mode === "login" ? "Entrar" : "Criar conta"}</div>
              <h2 className="text-2xl font-medium tracking-tight">
                {mode === "login" ? "Bem-vindo de volta" : "Comece agora"}
              </h2>
            </div>

            {msg && (
              <div
                className={`hairline p-3 text-xs ${
                  msg.tone === "err"
                    ? "border-destructive/40 text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {msg.text}
              </div>
            )}

            {mode === "signup" && (
              <label className="block">
                <span className="eyebrow mb-1.5 block">Nome completo</span>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="h-11 w-full hairline bg-transparent px-3 text-sm outline-none focus:border-foreground"
                />
              </label>
            )}
            <label className="block">
              <span className="eyebrow mb-1.5 block">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 w-full hairline bg-transparent px-3 text-sm outline-none focus:border-foreground"
              />
            </label>
            <label className="block">
              <span className="eyebrow mb-1.5 block">Senha</span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full hairline bg-transparent px-3 text-sm outline-none focus:border-foreground"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center rounded-sm bg-foreground text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "…" : mode === "login" ? "Entrar" : "Criar conta"}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setMsg(null);
              }}
              className="w-full text-xs text-muted-foreground hover:text-foreground"
            >
              {mode === "login"
                ? "Não tem conta? Criar conta →"
                : "Já tem conta? Entrar →"}
            </button>

            <div className="pt-4 text-center">
              <Link to="/portal/editais" className="text-xs text-muted-foreground hover:text-foreground">
                Explorar editais sem cadastro →
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
