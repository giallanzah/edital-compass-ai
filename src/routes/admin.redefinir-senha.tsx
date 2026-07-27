import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/admin/redefinir-senha")({
  head: () => ({ meta: [{ title: "Redefinir senha · Backoffice" }] }),
  component: Redefinir,
});

type Status = "verificando" | "pronto" | "invalido";

function Redefinir() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("verificando");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);

  // O link do e-mail traz um token de recuperação no fragmento da URL; o
  // client do Supabase detecta isso automaticamente e emite o evento abaixo
  // ao estabelecer uma sessão temporária de recuperação.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStatus("pronto");
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStatus("pronto");
    });
    const timeout = setTimeout(() => {
      setStatus((s) => (s === "verificando" ? "invalido" : s));
    }, 4000);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) throw error;
      setOk(true);
      setTimeout(() => navigate({ to: "/admin/login" }), 2000);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao redefinir a senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-10">
          <Logo />
        </div>
        <div className="eyebrow mb-2">Backoffice</div>
        <h1 className="text-2xl font-medium tracking-tight">Definir nova senha</h1>

        {status === "verificando" && (
          <div className="mt-8 flex items-center gap-3 rounded-sm border border-[var(--hairline)] bg-secondary px-4 py-3">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-foreground" />
            <span className="text-sm text-muted-foreground">Validando link de recuperação…</span>
          </div>
        )}

        {status === "invalido" && (
          <div className="mt-8 space-y-4">
            <div className="rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Link inválido ou expirado. Solicite um novo e-mail de recuperação.
            </div>
            <Link
              to="/admin/recuperar-senha"
              className="inline-flex h-10 w-full items-center justify-center rounded-sm bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
            >
              Pedir novo link
            </Link>
          </div>
        )}

        {status === "pronto" && (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Escolha uma nova senha para sua conta.
            </p>
            {ok ? (
              <div className="mt-8 rounded-sm hairline p-4 text-sm">
                Senha atualizada. Redirecionando para o login…
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-8 space-y-5">
                <div>
                  <label className="eyebrow mb-1.5 block">Nova senha</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="h-10 w-full rounded-sm border border-[var(--hairline)] bg-background px-3 text-sm outline-none focus:border-foreground"
                  />
                </div>
                <div>
                  <label className="eyebrow mb-1.5 block">Confirmar senha</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    className="h-10 w-full rounded-sm border border-[var(--hairline)] bg-background px-3 text-sm outline-none focus:border-foreground"
                  />
                </div>
                {erro && (
                  <div className="rounded-sm border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    {erro}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-10 w-full items-center justify-center rounded-sm bg-foreground px-4 text-sm font-medium text-background hover:opacity-90 disabled:opacity-60"
                >
                  {loading ? "Salvando…" : "Salvar nova senha"}
                </button>
              </form>
            )}
          </>
        )}

        <div className="mt-10 text-center">
          <Link
            to="/admin/login"
            className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            ← voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}
