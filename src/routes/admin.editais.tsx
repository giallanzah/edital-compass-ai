import { createFileRoute } from "@tanstack/react-router";
import { editais, formatBRL } from "@/data/editais";

export const Route = createFileRoute("/admin/editais")({
  component: AdminEditais,
});

function AdminEditais() {
  return (
    <div className="px-8 py-10">
      <div className="flex items-end justify-between">
        <div>
          <div className="eyebrow mb-2">CRUD</div>
          <h1 className="text-3xl font-medium tracking-tight">Editais</h1>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex h-9 items-center rounded-sm hairline px-4 text-sm hover:bg-secondary">
            Exportar CSV
          </button>
          <button className="inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-sm font-medium text-background">
            + Novo edital
          </button>
        </div>
      </div>

      <div className="mt-8 hairline">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 hairline-b eyebrow">
          <div className="col-span-5">Título</div>
          <div className="col-span-2">Órgão</div>
          <div className="col-span-2">Modalidade</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">Recursos</div>
          <div className="col-span-1 text-right">Ações</div>
        </div>
        {editais.map((e) => (
          <div
            key={e.id}
            className="grid grid-cols-12 items-center gap-4 px-5 py-3.5 hairline-b last:border-0 text-sm hover:bg-secondary"
          >
            <div className="col-span-5">
              <div className="font-medium leading-snug">{e.title}</div>
              <div className="font-mono text-[10px] text-muted-foreground">{e.id}</div>
            </div>
            <div className="col-span-2 font-mono text-xs">{e.agency}</div>
            <div className="col-span-2 text-xs text-muted-foreground">{e.modality}</div>
            <div className="col-span-1">
              <span
                className={`rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase ${
                  e.status === "Aberto"
                    ? "bg-foreground text-background"
                    : "hairline text-muted-foreground"
                }`}
              >
                {e.status}
              </span>
            </div>
            <div className="col-span-1 text-right font-mono text-xs">
              {e.amountMax ? formatBRL(e.amountMax) : "—"}
            </div>
            <div className="col-span-1 text-right font-mono text-xs">
              <button className="text-muted-foreground hover:text-foreground">editar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
