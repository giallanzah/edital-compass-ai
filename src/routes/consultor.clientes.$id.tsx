import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
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
} from "@/lib/consultor.functions";
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
