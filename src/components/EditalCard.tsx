import { Link } from "@tanstack/react-router";
import { type Edital, formatBRL, daysUntil } from "@/data/editais";

export function EditalCard({ e }: { e: Edital }) {
  const d = daysUntil(e.deadline);
  return (
    <Link
      to="/portal/editais/$id"
      params={{ id: e.id }}
      className="group block hairline bg-card p-5 transition-colors hover:border-foreground"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="eyebrow">{e.agency}</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span className="eyebrow">{e.modality}</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-foreground" />
          MATCH {e.match}
        </div>
      </div>
      <h3 className="mt-3 text-[15px] font-medium leading-snug tracking-tight">{e.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{e.summary}</p>
      <div className="mt-5 flex items-end justify-between">
        <div>
          <div className="eyebrow mb-1">Recursos</div>
          <div className="font-mono text-sm">
            {e.amountMax === 0
              ? "Variável"
              : `${formatBRL(e.amountMin)} – ${formatBRL(e.amountMax)}`}
          </div>
        </div>
        <div className="text-right">
          <div className="eyebrow mb-1">Prazo</div>
          <div className="font-mono text-sm">
            {d > 0 ? `${d} dias` : "encerrado"}
          </div>
        </div>
      </div>
    </Link>
  );
}
