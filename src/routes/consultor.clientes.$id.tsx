import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  listarKanbanCliente,
  moverEstagioConsultor,
  listarAtividades,
  criarAtividade,
} from "@/lib/consultor.functions";
import { refinarTexto, type ModoTexto } from "@/lib/ai.functions";
import { BarraIA } from "@/components/BarraIA";
import { AdminErrorState } from "@/components/AdminErrorState";

export const Route = createFileRoute("/consultor/clientes/$id")({
  head: () => ({ meta: [{ title: "Cliente · Consultor · fomenta.ai" }] }),
  component: ClienteDetalhe,
});

const STAGES = [
  ["rascunho", "Rascunho"],
  ["aplicando", "Aplicando"],
  ["em_revisao", "Em revisão"],
  ["submetido", "Submetido"],
  ["aprovado", "Aprovado"],
  ["reprovado", "Reprovado"],
] as const;

type Estagio = (typeof STAGES)[number][0];
type Row = Awaited<ReturnType<typeof listarKanbanCliente>>["candidaturas"][number];

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

function ClienteDetalhe() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const kanbanFn = useServerFn(listarKanbanCliente);
  const moverFn = useServerFn(moverEstagioConsultor);
  const atividadesFn = useServerFn(listarAtividades);

  const q = useQuery({
    queryKey: ["consultor", "kanban-cliente", id],
    queryFn: () => kanbanFn({ data: { empresaId: id } }),
  });
  const atividadesQ = useQuery({
    queryKey: ["consultor", "atividades"],
    queryFn: () => atividadesFn(),
  });

  const moverMut = useMutation({
    mutationFn: async (v: { id: string; estagio: string }) => moverFn({ data: v }),
    onSettled: () => qc.invalidateQueries({ queryKey: ["consultor", "kanban-cliente", id] }),
  });

  // --- Parecer do consultor (rascunho com apoio de IA) ---
  const refinarFn = useServerFn(refinarTexto);
  const criarAtividadeFn = useServerFn(criarAtividade);
  const [parecer, setParecer] = useState("");
  const [vinculo, setVinculo] = useState<string>("");
  const [anterior, setAnterior] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  const refinarMut = useMutation({
    mutationFn: async (modo: ModoTexto) =>
      refinarFn({ data: { texto: parecer, modo, formato: "texto" } }),
    onSuccess: (r) => {
      setAnterior(parecer);
      setParecer((r as { texto: string }).texto);
    },
  });

  const registrarMut = useMutation({
    mutationFn: async () =>
      criarAtividadeFn({
        data: {
          empresaId: id,
          candidaturaId: vinculo || null,
          tipo: "parecer",
          descricao: parecer.trim(),
        },
      }),
    onSuccess: () => {
      setParecer("");
      setAnterior(null);
      setVinculo("");
      setSalvo(true);
      qc.invalidateQueries({ queryKey: ["consultor", "atividades"] });
    },
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));


  if (q.isError) return <AdminErrorState error={q.error as Error} />;
  if (q.isLoading) {
    return <div className="p-10 text-sm text-muted-foreground">Carregando…</div>;
  }

  const data = q.data;
  const items = data?.candidaturas ?? [];
  const historico = (atividadesQ.data ?? []).filter(
    (a) => (a.empresa as { id: string } | null)?.id === id,
  );

  function onDragEnd(ev: DragEndEvent) {
    const candId = String(ev.active.id);
    const dest = ev.over?.id ? String(ev.over.id) : null;
    if (!dest) return;
    const atual = items.find((r) => r.id === candId);
    if (!atual || atual.estagio === dest) return;
    moverMut.mutate({ id: candId, estagio: dest });
  }

  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <button
        onClick={() => navigate({ to: "/consultor/clientes" })}
        className="eyebrow hover:text-foreground"
      >
        ← Clientes
      </button>

      <h1 className="mt-4 text-3xl font-medium tracking-tight">
        {data?.empresa.nome_empresa ?? "Cliente"}
      </h1>

      <h2 className="mb-3 mt-8 text-sm font-medium">Kanban de candidaturas</h2>
      {items.length === 0 ? (
        <div className="hairline p-12 text-center text-sm text-muted-foreground">
          Este cliente ainda não tem candidaturas registradas.
        </div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="grid grid-cols-2 hairline md:grid-cols-6">
            {STAGES.map(([k, label], i) => (
              <Column
                key={k}
                estagio={k}
                label={label}
                items={items.filter((r) => r.estagio === k)}
                divider={i !== 0}
              />
            ))}
          </div>
          <p className="mt-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            arraste os cartões entre colunas para mudar o estágio
          </p>
        </DndContext>
      )}

      <div className="mt-10 hairline bg-card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-sm font-medium">Parecer do consultor</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Escreva a análise para este cliente. A IA organiza, aprofunda ou revisa o texto — você
              revisa antes de registrar.
            </p>
          </div>
          {items.length > 0 && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Vincular a
              <select
                value={vinculo}
                onChange={(e) => setVinculo(e.target.value)}
                className="h-8 rounded-sm hairline bg-background px-2 text-xs"
              >
                <option value="">nenhuma candidatura</option>
                {items.map((r) => (
                  <option key={r.id} value={r.id}>
                    {(r.projeto as { nome: string } | null)?.nome ?? "—"}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <textarea
          value={parecer}
          onChange={(e) => {
            setParecer(e.target.value);
            setSalvo(false);
          }}
          rows={7}
          placeholder="Diagnóstico, recomendações e próximos passos para o cliente…"
          className="mt-4 w-full rounded-sm hairline bg-background p-3 text-sm"
        />

        <BarraIA
          disabled={!parecer.trim()}
          pending={refinarMut.isPending}
          error={refinarMut.error as Error | null}
          podeDesfazer={anterior !== null}
          onModo={(m) => refinarMut.mutate(m)}
          onDesfazer={() => {
            if (anterior !== null) {
              setParecer(anterior);
              setAnterior(null);
            }
          }}
        />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--hairline)] pt-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {salvo ? "parecer registrado ✓" : `${parecer.trim().length} caracteres`}
          </span>
          <div className="flex items-center gap-2">
            {registrarMut.error && (
              <span className="text-xs text-destructive">
                {(registrarMut.error as Error).message}
              </span>
            )}
            <button
              type="button"
              disabled={!parecer.trim() || registrarMut.isPending}
              onClick={() => registrarMut.mutate()}
              className="inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-sm font-medium text-background disabled:opacity-40"
            >
              {registrarMut.isPending ? "Registrando…" : "Registrar no histórico"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 hairline bg-card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-sm font-medium">Revisão da proposta do cliente</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Leia a proposta escrita pelo empreendedor e gere uma sugestão de texto com IA antes de
              enviar. O texto original do cliente não é alterado.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Candidatura
            <select
              value={revisandoId}
              onChange={(e) => {
                setRevisandoId(e.target.value);
                setSugestao("");
                setAnteriorSugestao(null);
                setSugestaoEnviada(false);
              }}
              className="h-8 rounded-sm hairline bg-background px-2 text-xs"
            >
              <option value="">selecione…</option>
              {items.map((r) => (
                <option key={r.id} value={r.id}>
                  {(r.projeto as { nome: string } | null)?.nome ?? "—"}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!revisandoId ? (
          <div className="mt-4 hairline p-8 text-center text-xs text-muted-foreground">
            Escolha uma candidatura para carregar a proposta.
          </div>
        ) : propostaQ.isLoading ? (
          <div className="mt-4 text-xs text-muted-foreground">Carregando proposta…</div>
        ) : propostaQ.isError ? (
          <div className="mt-4 text-xs text-destructive">
            {(propostaQ.error as Error).message}
          </div>
        ) : !propostaOriginal ? (
          <div className="mt-4 hairline p-8 text-center text-xs text-muted-foreground">
            O cliente ainda não escreveu uma proposta para esta candidatura.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="eyebrow mb-1">Texto do cliente</div>
              <div className="hairline max-h-72 overflow-auto whitespace-pre-wrap bg-background p-3 text-xs leading-relaxed">
                {propostaOriginal}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSugestao(propostaOriginal);
                  setAnteriorSugestao(null);
                  setSugestaoEnviada(false);
                }}
                className="mt-2 text-xs text-muted-foreground underline hover:text-foreground"
              >
                copiar para a área de sugestão
              </button>
            </div>
            <div>
              <div className="eyebrow mb-1">Sua sugestão</div>
              <textarea
                value={sugestao}
                onChange={(e) => {
                  setSugestao(e.target.value);
                  setSugestaoEnviada(false);
                }}
                rows={12}
                placeholder="Cole ou copie o texto do cliente e use a IA para organizar, evoluir ou revisar…"
                className="w-full rounded-sm hairline bg-background p-3 text-xs leading-relaxed"
              />
              <BarraIA
                disabled={!sugestao.trim()}
                pending={refinarSugestaoMut.isPending}
                error={refinarSugestaoMut.error as Error | null}
                podeDesfazer={anteriorSugestao !== null}
                onModo={(m) => refinarSugestaoMut.mutate(m)}
                onDesfazer={() => {
                  if (anteriorSugestao !== null) {
                    setSugestao(anteriorSugestao);
                    setAnteriorSugestao(null);
                  }
                }}
              />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--hairline)] pt-4">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {sugestaoEnviada ? "sugestão registrada ✓" : `${sugestao.trim().length} caracteres`}
                </span>
                <div className="flex items-center gap-2">
                  {enviarSugestaoMut.error && (
                    <span className="text-xs text-destructive">
                      {(enviarSugestaoMut.error as Error).message}
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={!sugestao.trim() || enviarSugestaoMut.isPending}
                    onClick={() => enviarSugestaoMut.mutate()}
                    className="inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-sm font-medium text-background disabled:opacity-40"
                  >
                    {enviarSugestaoMut.isPending ? "Enviando…" : "Enviar sugestão ao cliente"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>


      <h2 className="mb-3 mt-10 text-sm font-medium">Histórico de atividades</h2>
      <div className="hairline divide-y divide-[var(--hairline)] text-sm">
        {historico.length === 0 ? (
          <div className="px-5 py-3 text-muted-foreground">Nenhuma atividade registrada.</div>
        ) : (
          historico.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <span className="rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-[10px] uppercase">
                  {a.tipo}
                </span>
                <span className="ml-2 text-sm">{a.descricao}</span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                {new Date(a.created_at).toLocaleDateString("pt-BR")} · {a.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Column({
  estagio,
  label,
  items,
  divider,
}: {
  estagio: Estagio;
  label: string;
  items: Row[];
  divider: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: estagio });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[280px] p-3 ${divider ? "md:border-l border-[var(--hairline)]" : ""} ${isOver ? "bg-secondary" : ""}`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="eyebrow">{label}</span>
        <span className="font-mono text-[10px] text-muted-foreground">{items.length}</span>
      </div>
      <div className="space-y-2">
        {items.map((r) => (
          <Card key={r.id} row={r} />
        ))}
      </div>
    </div>
  );
}

function Card({ row }: { row: Row }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: row.id,
  });
  const ed = row.edital as { titulo: string; data_encerramento: string | null } | null;
  const dias = daysUntil(ed?.data_encerramento);
  const urgente =
    dias !== null &&
    dias >= 0 &&
    dias <= 7 &&
    !["submetido", "aprovado", "reprovado"].includes(row.estagio);
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`hairline bg-card p-3 ${isDragging ? "opacity-40" : "hover:border-foreground"} cursor-grab active:cursor-grabbing`}
    >
      <div className="text-xs font-medium leading-snug">
        {(row.projeto as { nome: string } | null)?.nome ?? "—"}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{ed?.titulo ?? "—"}</div>
      {urgente && (
        <div className="mt-2 flex items-center justify-end">
          <span className="rounded-sm bg-destructive/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-destructive">
            {dias === 0 ? "hoje" : `${dias}d`}
          </span>
        </div>
      )}
    </div>
  );
}
