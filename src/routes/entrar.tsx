import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
    label: "Empreendedor",
    desc: "Empresa buscando editais, match score e acompanhamento de candidaturas.",
    destino: "/portal",
  },
  {
    id: "consultor",
    label: "Consultor",
    desc: "Gestão de carteira de clientes, atividades e candidaturas assessoradas.",
    destino: "/consultor",
  },
  {
    id: "admin",
    label: "Administrador",
    desc: "Backoffice da plataforma: fontes do robô, usuários e indicadores.",
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


  const podeCadastrar = perfil === "empreendedor";

  useEffect(() => {
    if (!podeCadastrar) setMode("login");
  }, [podeCadastrar]);

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
        if (!data.session) {
          setMsg({ tone: "ok", text: "Conta criada. Confirme o email para acessar a plataforma." });
          return;
        }
        navigate({ to: "/portal/onboarding" });
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const destino = await destinoPorRole();
      const esperado = PERFIS.find((p) => p.id === perfil)!.destino;
      if (destino !== esperado && perfil !== "empreendedor") {
        setMsg({
          tone: "err",
          text:
            perfil === "admin"
              ? "Esta conta não possui perfil de administrador."
              : "Esta conta não está credenciada como consultor.",
        });
        return;
      }
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
          <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
            <div>
              <div className="eyebrow mb-2">Tipo de acesso</div>
              <div className="grid grid-cols-3 gap-2">
                {PERFIS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPerfil(p.id)}
                    className={`hairline px-2 py-2 text-xs transition-colors ${
                      perfil === p.id
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {PERFIS.find((p) => p.id === perfil)!.desc}
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-medium tracking-tight">
                {mode === "login" ? "Entrar" : "Criar conta"}
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

            {podeCadastrar ? (
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                {mode === "login"
                  ? "Não tem conta? Cadastre sua empresa"
                  : "Já tem conta? Entrar"}
              </button>
            ) : (
              <p className="text-center text-xs text-muted-foreground">
                {perfil === "consultor"
                  ? "Consultores são credenciados pela equipe fomenta.ai."
                  : "Contas de administrador são criadas internamente."}
              </p>
            )}

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
