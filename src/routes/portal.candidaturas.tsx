import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyCandidaturas } from "@/lib/portal.functions";

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

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

function Candidaturas() {
  const fn = useServerFn(listMyCandidaturas);
  const { data = [], isLoading } = useQuery({
    queryKey: ["me", "candidaturas"],
    queryFn: () => fn(),
  });

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
      <div className="eyebrow mb-2">Acompanhamento</div>
      <h1 className="text-3xl font-medium tracking-tight">Candidaturas</h1>

      <div className="mt-8 grid grid-cols-2 hairline md:grid-cols-6">
        {STAGES.map(([k, label], i) => {
          const items = data.filter((r) => r.estagio === k);
          return (
            <div
              key={k}
              className={`min-h-[240px] p-3 ${i !== 0 ? "md:border-l border-[var(--hairline)]" : ""}`}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="eyebrow">{label}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((r) => {
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
                      className="block hairline bg-card p-3 hover:border-foreground"
                    >
                      <div className="text-xs font-medium leading-snug">
                        {(r.projeto as { nome: string } | null)?.nome ?? "—"}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                        {ed?.titulo ?? "—"}
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {r.progresso}%
                        </span>
                        {urgente && (
                          <span className="rounded-sm bg-destructive/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-destructive">
                            {dias === 0 ? "hoje" : `${dias}d`}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
