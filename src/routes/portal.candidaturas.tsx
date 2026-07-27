import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { listMyCandidaturas } from "@/lib/portal.functions";
import { mudarEstagio } from "@/lib/candidatura.functions";

export const Route = createFileRoute("/portal/candidaturas")({
  component: Candidaturas,
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

type Row = Awaited<ReturnType<typeof listMyCandidaturas>>[number];

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

const VIEW_KEY = "fomenta.candidaturas.view";

function Candidaturas() {
  const qc = useQueryClient();
  const fn = useServerFn(listMyCandidaturas);
  const estFn = useServerFn(mudarEstagio);
  const { data = [], isLoading } = useQuery({
    queryKey: ["me", "candidaturas"],
    queryFn: () => fn(),
  });

  const [view, setView] = useState<"lista" | "kanban">("kanban");
  useEffect(() => {
    const v = typeof window !== "undefined" ? window.localStorage.getItem(VIEW_KEY) : null;
    if (v === "lista" || v === "kanban") setView(v);
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem(VIEW_KEY, view);
  }, [view]);

  const estMut = useMutation({
    mutationFn: async (v: { id: string; estagio: string }) => estFn({ data: v }),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: ["me", "candidaturas"] });
      const prev = qc.getQueryData<Row[]>(["me", "candidaturas"]);
      qc.setQueryData<Row[]>(["me", "candidaturas"], (rows) =>
        (rows ?? []).map((r) => (r.id === v.id ? { ...r, estagio: v.estagio } : r)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["me", "candidaturas"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["me", "candidaturas"] }),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function onDragEnd(ev: DragEndEvent) {
    const id = String(ev.active.id);
    const dest = ev.over?.id ? String(ev.over.id) : null;
    if (!dest) return;
    const atual = data.find((r) => r.id === id);
    if (!atual || atual.estagio === dest) return;
    estMut.mutate({ id, estagio: dest });
  }

  if (isLoading) {
    return <div className="p-10 text-sm text-muted-foreground">Carregando…</div>;
  }

  if (data.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-16">
        <div className="eyebrow mb-2">Acompanhamento</div>
        <h1 className="text-3xl font-medium tracking-tight">Candidaturas</h1>
        <div className="mt-8 hairline p-12 text-center">
          <div className="text-sm">Nenhuma candidatura registrada.</div>
          <p className="mt-2 text-xs text-muted-foreground">
            Vincule um projeto seu a um edital para começar a acompanhá-la aqui.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link
              to="/portal/projetos"
              className="inline-flex h-9 items-center rounded-sm hairline px-4 text-sm hover:bg-secondary"
            >
              Meus projetos
            </Link>
            <Link
              to="/portal/editais"
              className="inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-sm font-medium text-background"
            >
              Ver editais
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-2">Acompanhamento</div>
          <h1 className="text-3xl font-medium tracking-tight">Candidaturas</h1>
        </div>
        <div className="inline-flex hairline text-[11px] font-mono uppercase tracking-wider">
          <button
            onClick={() => setView("lista")}
            className={`px-3 py-1.5 ${view === "lista" ? "bg-foreground text-background" : "hover:bg-secondary"}`}
          >
            Lista
          </button>
          <button
            onClick={() => setView("kanban")}
            className={`px-3 py-1.5 border-l border-[var(--hairline)] ${view === "kanban" ? "bg-foreground text-background" : "hover:bg-secondary"}`}
          >
            Kanban
          </button>
        </div>
      </div>

      {view === "lista" ? (
        <ListaView rows={data} />
      ) : (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="mt-8 grid grid-cols-2 hairline md:grid-cols-6">
            {STAGES.map(([k, label], i) => {
              const items = data.filter((r) => r.estagio === k);
              return <Column key={k} estagio={k} label={label} items={items} divider={i !== 0} />;
            })}
          </div>
          <p className="mt-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            arraste os cartões entre colunas para mudar o estágio
          </p>
        </DndContext>
      )}
    </div>
  );
}

function ListaView({ rows }: { rows: Row[] }) {
  return (
    <div className="mt-8 hairline">
      <div className="grid grid-cols-12 gap-4 px-5 py-3 hairline-b eyebrow">
        <div className="col-span-4">Projeto</div>
        <div className="col-span-4">Edital</div>
        <div className="col-span-2">Estágio</div>
        <div className="col-span-1 text-right">Prazo</div>
        <div className="col-span-1 text-right">%</div>
      </div>
      {rows.map((r) => {
        const ed = r.edital as { titulo: string; data_encerramento: string | null } | null;
        const dias = daysUntil(ed?.data_encerramento);
        const urgente =
          dias !== null &&
          dias >= 0 &&
          dias <= 7 &&
          !["submetido", "aprovado", "reprovado"].includes(r.estagio);
        return (
          <Link
            key={r.id}
            to="/portal/candidaturas/$id"
            params={{ id: r.id }}
            className="grid grid-cols-12 items-center gap-4 px-5 py-3 hairline-b text-sm hover:bg-secondary last:border-0"
          >
            <div className="col-span-4 font-medium">
              {(r.projeto as { nome: string } | null)?.nome ?? "—"}
            </div>
            <div className="col-span-4 text-xs text-muted-foreground line-clamp-1">
              {ed?.titulo ?? "—"}
            </div>
            <div className="col-span-2 font-mono text-[10px] uppercase tracking-wider">
              {STAGES.find(([k]) => k === r.estagio)?.[1] ?? r.estagio}
            </div>
            <div className="col-span-1 text-right">
              {urgente ? (
                <span className="rounded-sm bg-destructive/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-destructive">
                  {dias === 0 ? "hoje" : `${dias}d`}
                </span>
              ) : (
                <span className="font-mono text-[10px] text-muted-foreground">
                  {dias === null ? "—" : dias > 0 ? `${dias}d` : "—"}
                </span>
              )}
            </div>
            <div className="col-span-1 text-right font-mono text-[10px] text-muted-foreground">
              {r.progresso}%
            </div>
          </Link>
        );
      })}
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
      {row.consultor && (
        <div className="mt-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          consultor: {(row.consultor as { nome: string }).nome}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between gap-2">
        <Link
          to="/portal/candidaturas/$id"
          params={{ id: row.id }}
          onClick={(e) => e.stopPropagation()}
          className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          abrir
        </Link>
        {urgente && (
          <span className="rounded-sm bg-destructive/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-destructive">
            {dias === 0 ? "hoje" : `${dias}d`}
          </span>
        )}
      </div>
    </div>
  );
}
