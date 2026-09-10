import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { registrarSolicitacaoAcesso, minhaSolicitacao } from "@/lib/acesso.functions";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/entrar")({
  validateSearch: (search: Record<string, unknown>) => {
    const raw = typeof search.redirect === "string" ? search.redirect : "";
    // Só aceitamos caminhos internos — nunca URLs externas.
    const redirect = raw.startsWith("/") && !raw.startsWith("//") ? raw : undefined;
    return { redirect };
  },
  head: () => ({
    meta: [
      { title: "Entrar na plataforma · fomenta.ai" },
      {
        name: "description",
        content:
          "Acesse a fomenta.ai como empreendedor, consultor ou administrador e gerencie editais de fomento em um só lugar.",
      },
      { property: "og:title", content: "Entrar na plataforma · fomenta.ai" },
      {
        property: "og:description",
        content: "Login unificado para empreendedores, consultores e administradores da fomenta.ai.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EntrarPage,
});

type Perfil = "empreendedor" | "consultor" | "admin";

const PERFIS: { id: Perfil; label: string; desc: string; destino: string }[] = [
  {
    id: "empreendedor",
    label: "Empresa / Empreendedor",
    desc: "Quero captar recursos de fomento para meus projetos.",
    destino: "/portal",
  },
  {
    id: "consultor",
    label: "Consultor Especialista",
    desc: "Quero ajudar empresas a aprovar projetos e monetizar minha expertise.",
    destino: "/consultor",
  },
  {
    id: "admin",
    label: "Equipe Fomenta",
    desc: "Acesso administrativo (requer aprovação).",
    destino: "/admin",
  },
];

async function destinoPorRole(): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return "/portal";
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
  const roles = (data ?? []).map((r) => r.role as string);
  if (roles.includes("SUPER_ADMIN") || roles.includes("ADMIN")) return "/admin";
  if (roles.includes("CONSULTOR")) return "/consultor";
  return "/portal";
}

function EntrarPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [perfil, setPerfil] = useState<Perfil>("empreendedor");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ tone: "err" | "ok"; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) navigate({ to: redirect ?? (await destinoPorRole()) });
    });
  }, [navigate, redirect]);


  const registrarSolicitacao = useServerFn(registrarSolicitacaoAcesso);
  const consultarSolicitacao = useServerFn(minhaSolicitacao);

  const avisoAnalise = (p: Perfil) =>
    `Cadastro recebido! Seu perfil de ${
      p === "consultor" ? "Consultor" : "Equipe"
    } está em análise. Nossa equipe entrará em contato em breve para liberar seu acesso.`;

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
            emailRedirectTo:
              typeof window !== "undefined" ? window.location.origin + "/portal" : undefined,
            data: { full_name: nome, perfil_desejado: perfil },
          },
        });
        if (error) throw error;

        if (perfil !== "empreendedor") {
          if (data.session) {
            await registrarSolicitacao({ data: { perfil, nome } });
            await supabase.auth.signOut();
          }
          setMsg({ tone: "ok", text: avisoAnalise(perfil) });
          setMode("login");
          return;
        }

        if (!data.session) {
          setMsg({ tone: "ok", text: "Conta criada. Confirme o email para acessar a plataforma." });
          return;
        }
        navigate({ to: "/portal/onboarding" });
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Perfil pendente de aprovação: registra/consulta a solicitação e avisa.
      if (perfil !== "empreendedor") {
        const destinoAtual = await destinoPorRole();
        const esperado = PERFIS.find((p) => p.id === perfil)!.destino;
        if (destinoAtual !== esperado) {
          let solicitacao = await consultarSolicitacao({ data: { perfil } });
          if (!solicitacao) {
            await registrarSolicitacao({ data: { perfil, nome: nome || undefined } });
            solicitacao = { status: "pendente", created_at: new Date().toISOString() };
          }
          await supabase.auth.signOut();
          setMsg({
            tone: solicitacao.status === "recusada" ? "err" : "ok",
            text:
              solicitacao.status === "recusada"
                ? "Sua solicitação de acesso foi recusada. Fale com a equipe fomenta.ai."
                : avisoAnalise(perfil),
          });
          return;
        }
        navigate({ to: redirect ?? esperado });
        return;
      }

      const destino = await destinoPorRole();
      navigate({ to: redirect ?? destino });
    } catch (err) {
      setMsg({ tone: "err", text: err instanceof Error ? err.message : "Erro ao entrar." });
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
            <div className="eyebrow mb-3">Acesso à plataforma</div>
            <h1 className="text-3xl font-medium tracking-tight">
              Um login, três formas de trabalhar com fomento.
            </h1>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Escolha o tipo de acesso: empresa, consultoria credenciada ou backoffice da
              plataforma.
            </p>
          </div>
          <div className="font-mono text-[11px] text-muted-foreground">© 2026 fomenta.ai</div>
        </div>

        <div className="flex items-center justify-center p-8">
          <form
            onSubmit={onSubmit}
            className={`w-full space-y-5 transition-all ${
              mode === "signup" ? "max-w-2xl" : "max-w-sm"
            }`}
          >
            <div>
              <div className="eyebrow mb-2">
                {mode === "login" ? "Acesso à plataforma" : "Tipo de cadastro"}
              </div>
              <h2 className="text-2xl font-medium tracking-tight">
                {mode === "login" ? "Entrar" : "Criar conta"}
              </h2>
            </div>

            {mode === "signup" && (
              <div className="space-y-5">
                <div className="text-center">
                  <h3 className="text-lg font-medium tracking-tight">
                    Como você deseja atuar na Fomenta.ai?
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Selecione o perfil que faz sentido para você.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {PERFIS.map((p) => {
                    const selected = perfil === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPerfil(p.id)}
                        aria-pressed={selected}
                        className={`hairline group relative flex flex-col items-start gap-3 p-4 text-left transition-all ${
                          selected
                            ? "border-foreground bg-secondary"
                            : "hover:bg-secondary/50"
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                            selected
                              ? "border-foreground bg-foreground text-background"
                              : "border-muted-foreground/30 text-muted-foreground group-hover:border-foreground/50 group-hover:text-foreground"
                          }`}
                        >
                          {p.id === "empreendedor" && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 21h18" />
                              <path d="M5 21V7l8-4 8 4v14" />
                              <path d="M9 21v-6h6v6" />
                            </svg>
                          )}
                          {p.id === "consultor" && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2l2.4 4.8L20 8l-4 4.2L16.8 18 12 15.6 7.2 18 8 12.2 4 8l5.6-1.2L12 2z" />
                            </svg>
                          )}
                          {p.id === "admin" && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                              <path d="M9 12l2 2 4-4" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <span className="text-sm font-medium">{p.label}</span>
                          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                            {p.desc}
                          </span>
                        </div>
                        <span
                          className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-medium transition-colors ${
                            selected
                              ? "border-foreground bg-foreground text-background"
                              : "border-muted-foreground/30 text-transparent group-hover:border-foreground/50"
                          }`}
                        >
                          ✓
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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

            {mode === "signup" && perfil !== "empreendedor" && (
              <p className="mx-auto w-full max-w-sm hairline p-3 text-xs text-muted-foreground">
                {perfil === "consultor"
                  ? "Contas de consultor passam por análise da equipe fomenta.ai antes da liberação."
                  : "Contas da Equipe Fomenta passam por aprovação interna antes da liberação."}
              </p>
            )}

            {(
              <div className="mx-auto w-full max-w-sm space-y-5">
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
                  className="h-11 w-full rounded-sm bg-foreground text-sm font-medium text-background disabled:opacity-50"
                >
                  {loading ? "Processando…" : mode === "login" ? "Entrar" : "Criar conta"}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setMsg(null);
                setMode(mode === "login" ? "signup" : "login");
              }}
              className="w-full text-xs text-muted-foreground hover:text-foreground"
            >
              {mode === "login" ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
            </button>

            <div className="text-center">
              <Link
                to="/admin/recuperar-senha"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Esqueci minha senha
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
