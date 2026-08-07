import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listEditais, contagemPorFonte, type EditalResumo } from "@/lib/scrape.functions";
import { Skeleton } from "@/components/ui/skeleton";

type EditaisSearch = { q?: string; fonte?: string; status?: string };

export const Route = createFileRoute("/portal/editais")({
  // Filtros vivem na URL: voltar do detalhe preserva a busca e o link é compartilhável.
  validateSearch: (search: Record<string, unknown>): EditaisSearch => ({
    q: typeof search.q === "string" && search.q ? search.q : undefined,
    fonte: typeof search.fonte === "string" && search.fonte ? search.fonte : undefined,
    status: typeof search.status === "string" && search.status ? search.status : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Editais e linhas de fomento · fomenta.ai" },
      {
        name: "description",
        content:
          "Catálogo de editais de CNPq, FINEP, SEBRAE e BNDES atualizado várias vezes ao dia.",
      },
    ],
  }),
  component: EditaisList,
});


const FONTES = ["CNPq", "FINEP", "SEBRAE", "BNDES"] as const;
const STATUS_LABEL: Record<string, string> = {
  aberto: "Aberto",
  abre_em_breve: "Abre em breve",
  encerrando_em_breve: "Encerrando em breve",
  encerrado: "Encerrado",
  sem_prazo: "Sem prazo",
};

function EditaisList() {
  // /portal/editais/$id é filho desta rota na árvore de rotas — sem esse
  // check, a rota filha carrega os dados certos (até o <head> de SEO fica
  // correto) mas nunca aparece na tela, porque esta rota nunca renderizava
  // um <Outlet /> para ela.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isIndex = pathname === "/portal/editais";

  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/portal/editais" });
  const q = search.q ?? "";
  const fonte = search.fonte ?? null;
  const status = search.status ?? null;

  function setFiltro(patch: EditaisSearch) {
    navigate({ search: (prev: EditaisSearch) => ({ ...prev, ...patch }), replace: true });
  }
  const setQ = (v: string) => setFiltro({ q: v || undefined });
  const setFonte = (v: string | null) => setFiltro({ fonte: v ?? undefined });
  const setStatus = (v: string | null) => setFiltro({ status: v ?? undefined });

  const list = useServerFn(listEditais);
  const cont = useServerFn(contagemPorFonte);

  const filtros = { busca: q, fonte: fonte ?? undefined, status: status ?? undefined };
  const editaisQ = useQuery({
    queryKey: ["editais", filtros],
    queryFn: () => list({ data: filtros }),
    enabled: isIndex,
  });
  const contQ = useQuery({
    queryKey: ["contagem-fonte"],
    queryFn: () => cont(),
    enabled: isIndex,
  });

  if (!isIndex) return <Outlet />;

  const items = editaisQ.data?.items ?? [];
  const contagem = contQ.data?.porFonte ?? {};
  const total = contQ.data?.total ?? 0;
  // Só tratamos como "banco vazio" quando a contagem realmente respondeu com
  // sucesso — se contQ falhou, isLoading também vira false e total fica 0,
  // o que antes disparava esse aviso mesmo em caso de erro.
  const bancoVazioConfirmado = contQ.isSuccess && total === 0;

  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <div className="eyebrow mb-2">Catálogo</div>
      <h1 className="text-3xl font-medium tracking-tight">Editais & linhas de fomento</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Dados coletados automaticamente de CNPq, FINEP, SEBRAE e BNDES — atualizados 4x ao dia.
      </p>

      <div className="mt-8 hairline flex items-center bg-card">
        <span className="px-4 font-mono text-xs text-muted-foreground">⌕</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por área, palavra-chave, projeto..."
          className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip active={!fonte} label="Todos" count={total} onClick={() => setFonte(null)} />
        {FONTES.map((f) => (
          <Chip
            key={f}
            active={fonte === f}
            label={f}
            count={contagem[f] ?? 0}
            onClick={() => setFonte(f)}
          />
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-8">
          <div>
            <div className="eyebrow mb-3">Status</div>
            <ul className="space-y-1.5 text-sm">
              <li>
                <button
                  onClick={() => setStatus(null)}
                  className={
                    !status ? "font-medium" : "text-muted-foreground hover:text-foreground"
                  }
                >
                  Todos
                </button>
              </li>
              {Object.entries(STATUS_LABEL).map(([k, label]) => (
                <li key={k}>
                  <button
                    onClick={() => setStatus(k)}
                    className={
                      status === k ? "font-medium" : "text-muted-foreground hover:text-foreground"
                    }
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-mono">
              {editaisQ.isLoading
                ? "carregando…"
                : editaisQ.isError
                  ? "erro ao carregar"
                  : `${items.length} resultados`}
            </span>
            {bancoVazioConfirmado && (
              <span className="font-mono text-[10px]">banco vazio — rode o robô no backoffice</span>
            )}
          </div>

          {editaisQ.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="hairline p-5 space-y-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))}
            </div>
          ) : editaisQ.isError ? (
            <div className="hairline p-12 text-center text-sm">
              <p className="text-muted-foreground">
                Não foi possível carregar os editais.{" "}
                <span className="font-mono text-xs">
                  {(editaisQ.error as Error)?.message || "erro desconhecido"}
                </span>
              </p>
              <button
                onClick={() => editaisQ.refetch()}
                className="mt-4 inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
              >
                Tentar novamente
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="hairline p-12 text-center text-sm text-muted-foreground">
              <p>Nenhum edital encontrado com esses filtros.</p>
              {(q || fonte || status) && (
                <button
                  onClick={() => navigate({ search: {}, replace: true })}
                  className="mt-4 inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((e) => (
                <EditalCard key={e.id} e={e} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm transition-colors ${
        active ? "bg-foreground text-background" : "hairline hover:bg-secondary"
      }`}
    >
      <span>{label}</span>
      <span className="font-mono text-[10px] opacity-70">{count}</span>
    </button>
  );
}

function EditalCard({ e }: { e: EditalResumo }) {
  const diasRestantes = e.data_encerramento
    ? Math.ceil((new Date(e.data_encerramento).getTime() - Date.now()) / 86_400_000)
    : null;
  const coletadoEm = new Date(e.coletado_em).toLocaleDateString("pt-BR");
  return (
    <Link
      to="/portal/editais/$id"
      params={{ id: e.id }}
      className="group block hairline bg-card p-5 transition-colors hover:border-foreground"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="eyebrow">{e.fonte}</span>
          {e.tipo_apoio && (
            <>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span className="eyebrow">{e.tipo_apoio}</span>
            </>
          )}
        </div>
        <span
          className={`rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase ${
            e.status === "aberto"
              ? "bg-foreground text-background"
              : "hairline text-muted-foreground"
          }`}
        >
          {STATUS_LABEL[e.status] ?? e.status}
        </span>
      </div>
      <h3 className="mt-3 text-[15px] font-medium leading-snug tracking-tight">{e.titulo}</h3>
      {e.descricao_curta && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{e.descricao_curta}</p>
      )}
      <div className="mt-5 flex items-end justify-between">
        <div>
          <div className="eyebrow mb-1">Abrangência</div>
          <div className="font-mono text-xs">{e.abrangencia ?? "—"}</div>
        </div>
        <div className="text-right">
          <div className="eyebrow mb-1">Prazo</div>
          <div className="font-mono text-xs">
            {diasRestantes === null
              ? "sem prazo"
              : diasRestantes > 0
                ? `${diasRestantes} dias`
                : "encerrado"}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[var(--hairline)] pt-3 font-mono text-[10px] text-muted-foreground">
        <span>verificado em {coletadoEm}</span>
        <a
          href={e.url_original}
          target="_blank"
          rel="noreferrer"
          onClick={(ev) => ev.stopPropagation()}
          className="hover:text-foreground"
        >
          fonte ↗
        </a>
      </div>
    </Link>
  );
}
