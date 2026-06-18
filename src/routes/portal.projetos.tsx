import { createFileRoute } from "@tanstack/react-router";
import { myProjects, daysUntil } from "@/data/editais";

export const Route = createFileRoute("/portal/projetos")({
  component: Projetos,
});

function Projetos() {
  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <div className="flex items-end justify-between">
        <div>
          <div className="eyebrow mb-2">Pipeline</div>
          <h1 className="text-3xl font-medium tracking-tight">Meus projetos</h1>
        </div>
        <button className="inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-sm font-medium text-background">
          + Novo projeto
        </button>
      </div>

      <div className="mt-8 hairline">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 hairline-b eyebrow">
          <div className="col-span-5">Projeto</div>
          <div className="col-span-2">Estágio</div>
          <div className="col-span-3">Edital alvo</div>
          <div className="col-span-1 text-right">Progresso</div>
          <div className="col-span-1 text-right">Prazo</div>
        </div>
        {myProjects.map((p) => (
          <div
            key={p.id}
            className="grid grid-cols-12 items-center gap-4 px-5 py-4 hairline-b last:border-0 hover:bg-secondary"
          >
            <div className="col-span-5 text-sm font-medium">{p.name}</div>
            <div className="col-span-2">
              <span className="hairline rounded-sm px-2 py-0.5 font-mono text-[10px] uppercase">
                {p.stage}
              </span>
            </div>
            <div className="col-span-3 text-sm text-muted-foreground">{p.edital}</div>
            <div className="col-span-1 text-right font-mono text-xs">{p.progress}%</div>
            <div className="col-span-1 text-right font-mono text-xs text-muted-foreground">
              {daysUntil(p.deadline)}d
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
