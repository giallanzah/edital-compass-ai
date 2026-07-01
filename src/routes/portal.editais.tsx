import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { listEditais, contagemPorFonte, type EditalResumo } from "@/lib/scrape.functions";

export const Route = createFileRoute("/portal/editais")({
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
const FALLBACK_CONTAGEM: Record<string, number> = {
  CNPq: 47,
  FINEP: 32,
  SEBRAE: 54,
  BNDES: 28,
};

function EditaisList() {
  const [q, setQ] = useState("");
  const [fonte, setFonte] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const list = useServerFn(listEditais);
  const cont = useServerFn(contagemPorFonte);

  const filtros = { busca: q, fonte: fonte ?? undefined, status: status ?? undefined };
  const editaisQ = useQuery({
    queryKey: ["editais", filtros],
    queryFn: () => list({ data: filtros }),
  });
  const contQ = useQuery({ queryKey: ["contagem-fonte"], queryFn: () => cont() });

  const items = editaisQ.data?.items ?? [];
  const contagem = useMemo(() => {
    const real = contQ.data?.porFonte ?? {};
    const useReal = (contQ.data?.total ?? 0) > 0;
    return useReal ? real : FALLBACK_CONTAGEM;
  }, [contQ.data]);
  const totalReal = contQ.data?.total ?? 0;
  const totalMostrado = totalReal > 0 ? totalReal : 8;

  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <div className="eyebrow mb-2">Catálogo</div>
      <h1 className="text-3xl font-medium tracking-tight">Editais & linhas de fomento</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Dados atualizados pelo robô Fomenta a partir de CNPq, FINEP, SEBRAE e BNDES.
      </p>

      {/* Search */}
      <div className="mt-8 hairline flex items-center bg-card">
        <span className="px-4 font-mono text-xs text-muted-foreground">⌕</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por área, palavra-chave, projeto..."
          className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Chips por fonte */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Chip active={!fonte} label="Todos" count={totalMostrado} onClick={() => setFonte(null)} />
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
                  className={!status ? "font-medium" : "text-muted-foreground hover:text-foreground"}
                >
                  Todos
                </button>
              </li>
              {Object.entries(STATUS_LABEL).map(([k, label]) => (
                <li key={k}>
                  <button
                    onClick={() => setStatus(k)}
                    className={status === k ? "font-medium" : "text-muted-foreground hover:text-foreground"}
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
              {editaisQ.isLoading ? "carregando…" : `${items.length} resultados`}
            </span>
            {contQ.data?.total === 0 && (
              <span className="font-mono text-[10px]">
                banco vazio — rode o robô no backoffice
              </span>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((e) => (
              <EditalCard key={e.id} e={e} />
            ))}
          </div>
          {!editaisQ.isLoading && items.length === 0 && (
            <div className="hairline p-12 text-center text-sm text-muted-foreground">
              Nenhum edital encontrado com esses filtros. Se o banco estiver vazio, execute
              a coleta em <span className="font-mono">/admin/fontes</span>.
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
    </Link>
  );
}
