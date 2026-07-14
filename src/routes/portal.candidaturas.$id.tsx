import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import {
  getCandidatura,
  mudarEstagio,
  salvarObservacoes,
  criarTarefa,
  toggleTarefa,
  removerTarefa,
} from "@/lib/candidatura.functions";
import { extrairRequisitos, analisarAderencia } from "@/lib/ai.functions";

export const Route = createFileRoute("/portal/candidaturas/$id")({
  head: () => ({ meta: [{ title: "Candidatura · fomenta.ai" }] }),
  component: CandidaturaDetalhe,
});

const ESTAGIOS = [
  ["rascunho", "Rascunho"],
  ["aplicando", "Aplicando"],
  ["em_revisao", "Em revisão"],
  ["submetido", "Submetido"],
  ["aprovado", "Aprovado"],
  ["reprovado", "Reprovado"],
] as const;

function CandidaturaDetalhe() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const getFn = useServerFn(getCandidatura);
  const estFn = useServerFn(mudarEstagio);
  const obsFn = useServerFn(salvarObservacoes);
  const criarTarefaFn = useServerFn(criarTarefa);
  const toggleFn = useServerFn(toggleTarefa);
  const removerFn = useServerFn(removerTarefa);
  const requisitosFn = useServerFn(extrairRequisitos);
  const aderenciaFn = useServerFn(analisarAderencia);

  const q = useQuery({ queryKey: ["candidatura", id], queryFn: () => getFn({ data: { id } }) });

  const [obs, setObs] = useState("");
  const [novaTarefa, setNovaTarefa] = useState("");

  useEffect(() => {
    if (q.data?.observacoes != null) setObs(q.data.observacoes ?? "");
  }, [q.data?.observacoes]);

  const estMut = useMutation({
    mutationFn: async (estagio: string) => estFn({ data: { id, estagio } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidatura", id] }),
  });

  const obsMut = useMutation({
    mutationFn: async () => obsFn({ data: { id, observacoes: obs } }),
  });

  const tarefaCreateMut = useMutation({
    mutationFn: async () =>
      criarTarefaFn({ data: { candidaturaId: id, titulo: novaTarefa } }),
    onSuccess: () => {
      setNovaTarefa("");
      qc.invalidateQueries({ queryKey: ["candidatura", id] });
    },
  });

  const toggleMut = useMutation({
    mutationFn: async (v: { id: string; feito: boolean }) => toggleFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidatura", id] }),
  });

  const removerMut = useMutation({
    mutationFn: async (tid: string) => removerFn({ data: { id: tid } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidatura", id] }),
  });

  const importarMut = useMutation({
    mutationFn: async () => {
      const edId = q.data?.edital && (q.data.edital as { id: string }).id;
      if (!edId) throw new Error("sem edital");
      const r = await requisitosFn({ data: { editalId: edId } });
      const itens = (r as { itens: string[] }).itens;
      // Cria em série (poucos itens, ~5-10)
      for (const t of itens) {
        await criarTarefaFn({ data: { candidaturaId: id, titulo: t } });
      }
      return { count: itens.length };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidatura", id] }),
  });

  const aderenciaMut = useMutation({
    mutationFn: async () => {
      const edId = q.data?.edital && (q.data.edital as { id: string }).id;
      const prId = q.data?.projeto && (q.data.projeto as { id: string }).id;
      if (!edId || !prId) throw new Error("dados incompletos");
      return aderenciaFn({ data: { editalId: edId, projetoId: prId } });
    },
  });

  if (q.isLoading) {
    return <div className="p-10 text-sm text-muted-foreground">Carregando…</div>;
  }
  const c = q.data;
  if (!c) {
    return (
      <div className="p-10 text-sm text-muted-foreground">
        Candidatura não encontrada.{" "}
        <Link to="/portal/candidaturas" className="underline">Voltar</Link>
      </div>
    );
  }

  const edital = c.edital as {
    id: string;
    titulo: string;
    slug: string;
    fonte: string;
    data_encerramento: string | null;
    url_original: string;
    tipo_apoio: string | null;
  } | null;
  const projeto = c.projeto as { id: string; nome: string; descricao: string | null } | null;
  const tarefas = c.tarefas as Array<{ id: string; titulo: string; feito: boolean; ordem: number }>;
  const feitas = tarefas.filter((t) => t.feito).length;
  const totalTarefas = tarefas.length;
  const progressoTarefas = totalTarefas > 0 ? Math.round((feitas / totalTarefas) * 100) : 0;

  const dias = edital?.data_encerramento
    ? Math.ceil((new Date(edital.data_encerramento).getTime() - Date.now()) / 86_400_000)
    : null;

  const aderenciaResult = aderenciaMut.data as
    | { score: number; parecer: string; pontos_fortes: string[]; riscos: string[] }
    | undefined;

  const urgente =
    dias !== null &&
    dias >= 0 &&
    dias <= 7 &&
    !["submetido", "aprovado", "reprovado"].includes(c.estagio);

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <button
        onClick={() => navigate({ to: "/portal/candidaturas" })}
        className="eyebrow hover:text-foreground"
      >
        ← Candidaturas
      </button>

      {urgente && (
        <div className="mt-4 flex items-center gap-3 rounded-sm border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-destructive" />
          <div>
            <strong>Prazo curto:</strong>{" "}
            {dias === 0
              ? "o edital encerra hoje."
              : `restam ${dias} dia${dias === 1 ? "" : "s"} até o encerramento.`}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="eyebrow mb-1">{edital?.fonte} · {edital?.tipo_apoio ?? "—"}</div>
          <h1 className="text-2xl font-medium tracking-tight">{edital?.titulo}</h1>
          <div className="mt-2 text-sm text-muted-foreground">
            Projeto: <span className="text-foreground">{projeto?.nome}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="eyebrow">Prazo</div>
          <div className="font-mono text-sm">
            {dias === null ? "sem prazo" : dias > 0 ? `${dias} dias` : "encerrado"}
          </div>
        </div>
      </div>


      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div className="eyebrow">Estágio</div>
              <span className="font-mono text-xs text-muted-foreground">{c.progresso}%</span>
            </div>
            <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
              {ESTAGIOS.map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => estMut.mutate(k)}
                  className={`hairline p-2 text-[11px] uppercase tracking-wider ${
                    c.estagio === k ? "bg-foreground text-background" : "hover:bg-secondary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <div className="eyebrow">Checklist ({feitas}/{totalTarefas} · {progressoTarefas}%)</div>
              <button
                onClick={() => importarMut.mutate()}
                disabled={importarMut.isPending}
                className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                {importarMut.isPending ? "importando…" : "importar da IA"}
              </button>
            </div>

            <div className="hairline">
              {tarefas.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  Nenhuma tarefa. Adicione abaixo ou clique em "importar da IA" para extrair
                  requisitos do edital.
                </div>
              ) : (
                <ul className="divide-y divide-[var(--hairline)]">
                  {tarefas.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 p-3">
                      <input
                        type="checkbox"
                        checked={t.feito}
                        onChange={(e) => toggleMut.mutate({ id: t.id, feito: e.target.checked })}
                      />
                      <span className={`flex-1 text-sm ${t.feito ? "line-through text-muted-foreground" : ""}`}>
                        {t.titulo}
                      </span>
                      <button
                        onClick={() => removerMut.mutate(t.id)}
                        className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-destructive"
                      >
                        remover
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2 border-t border-[var(--hairline)] p-3">
                <input
                  value={novaTarefa}
                  onChange={(e) => setNovaTarefa(e.target.value)}
                  placeholder="Nova tarefa…"
                  className="h-8 flex-1 rounded-sm hairline bg-background px-2 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && novaTarefa.trim()) tarefaCreateMut.mutate();
                  }}
                />
                <button
                  disabled={!novaTarefa.trim() || tarefaCreateMut.isPending}
                  onClick={() => tarefaCreateMut.mutate()}
                  className="inline-flex h-8 items-center rounded-sm bg-foreground px-3 text-xs font-medium text-background disabled:opacity-40"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </section>

          <section>
            <div className="eyebrow mb-3">Observações</div>
            <textarea
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              onBlur={() => obsMut.mutate()}
              rows={4}
              placeholder="Notas internas, pendências, links…"
              className="w-full rounded-sm hairline bg-background p-3 text-sm"
            />
            {obsMut.isPending && (
              <div className="mt-1 text-[10px] font-mono text-muted-foreground">salvando…</div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="hairline p-4">
            <div className="eyebrow mb-2">Análise de aderência (IA)</div>
            <p className="text-xs text-muted-foreground">
              Um parecer detalhado sobre o encaixe do seu projeto neste edital.
            </p>
            <button
              onClick={() => aderenciaMut.mutate()}
              disabled={aderenciaMut.isPending}
              className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-sm bg-foreground text-xs font-medium text-background disabled:opacity-40"
            >
              {aderenciaMut.isPending ? "Analisando…" : "Gerar análise"}
            </button>
            {aderenciaResult && (
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <div className="eyebrow">Score</div>
                  <div className="font-mono text-2xl">{aderenciaResult.score}</div>
                </div>
                <p className="text-xs leading-relaxed">{aderenciaResult.parecer}</p>
                {aderenciaResult.pontos_fortes?.length > 0 && (
                  <div>
                    <div className="eyebrow mb-1">Pontos fortes</div>
                    <ul className="list-disc space-y-1 pl-4 text-xs">
                      {aderenciaResult.pontos_fortes.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {aderenciaResult.riscos?.length > 0 && (
                  <div>
                    <div className="eyebrow mb-1">Riscos</div>
                    <ul className="list-disc space-y-1 pl-4 text-xs">
                      {aderenciaResult.riscos.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {aderenciaMut.error && (
              <div className="mt-3 text-[11px] text-destructive">
                {(aderenciaMut.error as Error).message}
              </div>
            )}
          </div>

          <div className="hairline p-4 text-xs">
            <div className="eyebrow mb-2">Edital</div>
            <Link
              to="/portal/editais/$id"
              params={{ id: edital?.slug ?? edital?.id ?? "" }}
              className="underline"
            >
              Abrir detalhe →
            </Link>
            {edital?.url_original && (
              <a
                href={edital.url_original}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block break-all text-muted-foreground underline"
              >
                Fonte oficial
              </a>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
