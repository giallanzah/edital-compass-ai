import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile, getRecomendados, listMyProjetos } from "@/lib/portal.functions";
import { alertasPrazo } from "@/lib/candidatura.functions";

export const Route = createFileRoute("/portal/")({
  component: Dashboard,
});

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

function Dashboard() {
  const navigate = useNavigate();
  const perfilFn = useServerFn(getMyProfile);
  const recFn = useServerFn(getRecomendados);
  const projFn = useServerFn(listMyProjetos);

  const perfilQ = useQuery({ queryKey: ["me", "profile"], queryFn: () => perfilFn() });
  const recQ = useQuery({
    queryKey: ["me", "recomendados"],
    queryFn: () => recFn(),
    enabled: !!perfilQ.data,
  });
  const projQ = useQuery({ queryKey: ["me", "projetos"], queryFn: () => projFn() });

  const perfil = perfilQ.data;
  const now = new Date();
  const saudacao =
    now.getHours() < 12 ? "Bom dia" : now.getHours() < 18 ? "Boa tarde" : "Boa noite";
  const nome = perfil?.nome_empresa ?? "";

  if (perfilQ.isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-8 py-10">
        <div className="h-8 w-40 animate-pulse rounded bg-secondary" />
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-16">
        <div className="eyebrow mb-3">Falta um passo</div>
        <h1 className="text-3xl font-medium tracking-tight">Configure o perfil da sua empresa</h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Assim conseguimos calcular o match score dos editais e recomendar aqueles em que sua
          empresa tem chance real de sucesso.
        </p>
        <button
          onClick={() => navigate({ to: "/portal/onboarding" })}
          className="mt-8 inline-flex h-11 items-center rounded-sm bg-foreground px-6 text-sm font-medium text-background hover:opacity-90"
        >
          Começar onboarding →
        </button>
      </div>
    );
  }

  const projetos = projQ.data ?? [];
  const rec = recQ.data;
  const itens = rec?.items ?? [];

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-2">Painel</div>
          <h1 className="text-3xl font-medium tracking-tight">
            {saudacao}, {nome}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {itens.length > 0
              ? `${itens.length} editais abertos batem com o perfil da sua empresa.`
              : "Nenhum edital aberto compatível encontrado agora. Volte em breve — o robô coleta 4x ao dia."}
          </p>
        </div>
        <Link
          to="/portal/editais"
          className="inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
        >
          Buscar editais
        </Link>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium">Recomendados para você</h2>
            <Link to="/portal/editais" className="text-xs text-muted-foreground hover:text-foreground">
              ver todos →
            </Link>
          </div>
          {recQ.isLoading ? (
            <div className="hairline p-6 text-sm text-muted-foreground">Calculando match…</div>
          ) : itens.length === 0 ? (
            <div className="hairline p-8 text-center text-sm text-muted-foreground">
              Nenhum edital aberto compatível no momento.
            </div>
          ) : (
            <div className="hairline divide-y divide-[var(--hairline)]">
              {itens.map(({ edital, match }) => {
                const d = daysUntil(edital.data_encerramento);
                return (
                  <Link
                    key={edital.id}
                    to="/portal/editais/$id"
                    params={{ id: edital.id }}
                    className="grid grid-cols-12 items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary"
                  >
                    <div className="col-span-1 font-mono text-xs text-muted-foreground">
                      {match.score}
                    </div>
                    <div className="col-span-8">
                      <div className="eyebrow mb-1">
                        {edital.fonte} · {edital.tipo_apoio ?? "—"}
                      </div>
                      <div className="text-sm font-medium leading-snug">{edital.titulo}</div>
                    </div>
                    <div className="col-span-3 text-right font-mono text-xs text-muted-foreground">
                      {d === null ? "sem prazo" : d > 0 ? `${d}d` : "encerrado"}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium">Pipeline</h2>
            <Link to="/portal/projetos" className="text-xs text-muted-foreground hover:text-foreground">
              gerenciar →
            </Link>
          </div>
          {projetos.length === 0 ? (
            <div className="hairline p-6">
              <div className="text-sm">Você ainda não tem projetos.</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Cadastre projetos para vinculá-los a candidaturas em editais.
              </p>
              <Link
                to="/portal/projetos"
                className="mt-4 inline-flex h-8 items-center rounded-sm bg-foreground px-3 text-xs font-medium text-background"
              >
                + Novo projeto
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {projetos.slice(0, 4).map((p) => (
                <div key={p.id} className="hairline p-4">
                  <div className="text-sm font-medium leading-snug">{p.nome}</div>
                  {p.descricao && (
                    <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.descricao}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
