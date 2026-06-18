import { createFileRoute, Link } from "@tanstack/react-router";
import { editais, myProjects, daysUntil, formatBRL } from "@/data/editais";

export const Route = createFileRoute("/portal/")({
  component: Dashboard,
});

function Dashboard() {
  const top = [...editais].sort((a, b) => b.match - a.match).slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <div className="flex items-end justify-between">
        <div>
          <div className="eyebrow mb-2">Painel · 18 Jun 2026</div>
          <h1 className="text-3xl font-medium tracking-tight">Bom dia, Hugo.</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            3 novos editais batem com seus projetos esta semana.
          </p>
        </div>
        <Link
          to="/portal/editais"
          className="inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
        >
          Buscar editais
        </Link>
      </div>

      {/* KPI strip */}
      <div className="mt-8 grid grid-cols-2 hairline md:grid-cols-4">
        {[
          { k: "Editais monitorados", v: "47" },
          { k: "Match score médio", v: "78" },
          { k: "Recursos potenciais", v: "R$ 12M" },
          { k: "Candidaturas ativas", v: "3" },
        ].map((s, i) => (
          <div
            key={s.k}
            className={`p-5 ${i !== 0 ? "border-l border-[var(--hairline)]" : ""}`}
          >
            <div className="font-mono text-2xl">{s.v}</div>
            <div className="eyebrow mt-1.5">{s.k}</div>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        {/* Recomendados */}
        <section className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium">Recomendados para você</h2>
            <Link to="/portal/editais" className="text-xs text-muted-foreground hover:text-foreground">
              ver todos →
            </Link>
          </div>
          <div className="hairline divide-y divide-[var(--hairline)]">
            {top.map((e) => {
              const d = daysUntil(e.deadline);
              return (
                <Link
                  key={e.id}
                  to="/portal/editais/$id"
                  params={{ id: e.id }}
                  className="grid grid-cols-12 items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary"
                >
                  <div className="col-span-1 font-mono text-xs text-muted-foreground">
                    {e.match}
                  </div>
                  <div className="col-span-7">
                    <div className="eyebrow mb-1">{e.agency} · {e.modality}</div>
                    <div className="text-sm font-medium leading-snug">{e.title}</div>
                  </div>
                  <div className="col-span-2 text-right font-mono text-xs">
                    {e.amountMax ? formatBRL(e.amountMax) : "—"}
                  </div>
                  <div className="col-span-2 text-right font-mono text-xs text-muted-foreground">
                    {d}d
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Meus projetos */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium">Pipeline</h2>
            <Link to="/portal/projetos" className="text-xs text-muted-foreground hover:text-foreground">
              gerenciar →
            </Link>
          </div>
          <div className="space-y-3">
            {myProjects.map((p) => (
              <div key={p.id} className="hairline p-4">
                <div className="eyebrow mb-2">{p.stage}</div>
                <div className="text-sm font-medium leading-snug">{p.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">→ {p.edital}</div>
                <div className="mt-3 h-1 w-full bg-secondary">
                  <div className="h-1 bg-foreground" style={{ width: `${p.progress}%` }} />
                </div>
                <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted-foreground">
                  <span>{p.progress}% completo</span>
                  <span>{daysUntil(p.deadline)}d</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
