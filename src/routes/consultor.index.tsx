import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { dashboardConsultor } from "@/lib/consultor.functions";

export const Route = createFileRoute("/consultor/")({ component: ConsultorDashboard });

const ESTAGIO_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  aplicando: "Aplicando",
  em_revisao: "Em revisão",
  submetido: "Submetido",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
};

function ConsultorDashboard() {
  const fn = useServerFn(dashboardConsultor);
  const q = useQuery({ queryKey: ["consultor", "dashboard"], queryFn: () => fn() });
  const d = q.data;

  return (
    <div className="px-8 py-10">
      <div className="eyebrow mb-2">Consultor · dashboard</div>
      <h1 className="text-3xl font-medium tracking-tight">Sua carteira</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Visão geral dos clientes ativos e do andamento das candidaturas que você acompanha.
      </p>

      {q.isLoading ? (
        <div className="mt-8 text-sm text-muted-foreground">Carregando…</div>
      ) : (
        <div className="mt-8 grid grid-cols-2 hairline md:grid-cols-3">
          <div className="p-5">
            <div className="font-mono text-2xl tracking-tight">{d?.totalClientes ?? 0}</div>
            <div className="eyebrow mt-1.5">Clientes ativos</div>
          </div>
          <div className="p-5 md:border-l border-[var(--hairline)]">
            <div className="font-mono text-2xl tracking-tight">{d?.creditosRestantes ?? 0}</div>
            <div className="eyebrow mt-1.5">Créditos restantes</div>
          </div>
          <div className="p-5 border-t md:border-t-0 md:border-l border-[var(--hairline)]">
            <div className="font-mono text-2xl tracking-tight">
              {Object.values(d?.candidaturasPorEstagio ?? {}).reduce((a, b) => a + b, 0)}
            </div>
            <div className="eyebrow mt-1.5">Candidaturas acompanhadas</div>
          </div>
        </div>
      )}

      <h2 className="mb-4 mt-10 text-sm font-medium">Candidaturas por estágio</h2>
      <div className="hairline divide-y divide-[var(--hairline)] text-sm">
        {Object.entries(ESTAGIO_LABEL).map(([k, label]) => (
          <div key={k} className="flex items-center justify-between px-5 py-3">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-mono text-xs">{d?.candidaturasPorEstagio[k] ?? 0}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-2">
        <Link
          to="/consultor/clientes"
          className="inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-sm font-medium text-background"
        >
          Ver clientes
        </Link>
        <Link
          to="/consultor/atividades"
          className="inline-flex h-9 items-center rounded-sm hairline px-4 text-sm hover:bg-secondary"
        >
          Ver atividades
        </Link>
      </div>
    </div>
  );
}
