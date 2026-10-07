import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { acoesConsultor, dashboardConsultor } from "@/lib/consultor.functions";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/consultor/")({ component: ConsultorDashboard });

const ESTAGIO_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  aplicando: "Aplicando",
  em_revisao: "Em revisão",
  submetido: "Submetido",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
};

const TIPO_LABEL: Record<string, string> = {
  chamado_cliente: "Chamado do cliente",
  revisao: "Revisão pendente",
  reuniao: "Reunião",
  tarefa: "Tarefa",
};

function ConsultorDashboard() {
  const fn = useServerFn(dashboardConsultor);
  const acoesFn = useServerFn(acoesConsultor);
  const q = useQuery({ queryKey: ["consultor", "dashboard"], queryFn: () => fn() });
  const a = useQuery({ queryKey: ["consultor", "acoes"], queryFn: () => acoesFn() });
  const d = q.data;
  const ac = a.data;
  const contratados = ac?.creditosContratados ?? 0;
  const usados = ac?.creditosUtilizados ?? 0;
  const pct = contratados ? Math.min(100, Math.round((usados / contratados) * 100)) : 0;

  return (
    <div className="px-8 py-10">
      <div className="eyebrow mb-2">Consultor · dashboard</div>
      <h1 className="text-3xl font-medium tracking-tight">Sua carteira</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        O que precisa da sua atenção hoje e como está sua operação.
      </p>

      <div className="mt-8 grid grid-cols-2 hairline md:grid-cols-4">
        <Kpi v={ac?.clientesVinculados} l="Clientes vinculados" />
        <Kpi v={ac?.revisoesEntregues} l="Revisões entregues" b />
        <Kpi v={Object.values(d?.candidaturasPorEstagio ?? {}).reduce((x, y) => x + y, 0)} l="Candidaturas acompanhadas" b />
        <div className="border-t border-[var(--hairline)] p-5 md:border-l md:border-t-0">
          <div className="font-mono text-2xl tracking-tight">
            {usados}<span className="text-muted-foreground">/{contratados}</span>
          </div>
          <div className="eyebrow mt-1.5">Créditos usados / contratados</div>
          <div className="mt-2 h-1 w-full bg-secondary">
            <div className="h-1 bg-foreground" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <h2 className="mb-4 mt-10 text-sm font-medium">Ações prioritárias do dia</h2>
      <div className="hairline">
        {a.isLoading ? (
          <div className="p-5 text-sm text-muted-foreground">Carregando…</div>
        ) : !ac?.prioritarias.length ? (
          <EmptyState icon="check" title="Tudo em dia">
            Nenhum chamado ou pendência aberta. Aproveite para revisar propostas dos seus clientes.
          </EmptyState>
        ) : (
          ac.prioritarias.map((p) => (
            <Link
              key={p.id}
              to="/consultor/clientes/$id"
              params={{ id: p.empresaId }}
              className="flex items-start justify-between gap-4 hairline-b px-5 py-3 text-sm last:border-0 hover:bg-secondary"
            >
              <div className="min-w-0">
                <div className="eyebrow">{TIPO_LABEL[p.tipo] ?? p.tipo} · {p.empresa}</div>
                <div className="mt-1 truncate">{p.descricao ?? "—"}</div>
              </div>
              {p.vencimento && (
                <span className={`shrink-0 font-mono text-[11px] ${p.atrasada ? "text-destructive" : "text-muted-foreground"}`}>
                  {p.atrasada ? "atrasada · " : ""}{new Date(p.vencimento + "T00:00").toLocaleDateString("pt-BR")}
                </span>
              )}
            </Link>
          ))
        )}
      </div>

      <h2 className="mb-4 mt-10 text-sm font-medium">Candidaturas por estágio</h2>
      <div className="hairline divide-y divide-[var(--hairline)] text-sm">
        {Object.entries(ESTAGIO_LABEL).map(([k, label]) => (
          <div key={k} className="flex items-center justify-between px-5 py-3">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-mono text-xs">{d?.candidaturasPorEstagio[k] ?? 0}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link to="/consultor/clientes" className="inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-sm font-medium text-background">
          Ver clientes
        </Link>
        <Link to="/consultor/revisoes" className="inline-flex h-9 items-center rounded-sm hairline px-4 text-sm hover:bg-secondary">
          Ver revisões
        </Link>
        <Link to="/consultor/atividades" className="inline-flex h-9 items-center rounded-sm hairline px-4 text-sm hover:bg-secondary">
          Ver atividades
        </Link>
      </div>
    </div>
  );
}

function Kpi({ v, l, b }: { v?: number; l: string; b?: boolean }) {
  return (
    <div className={`p-5 ${b ? "border-l border-[var(--hairline)]" : ""}`}>
      <div className="font-mono text-2xl tracking-tight">{v ?? 0}</div>
      <div className="eyebrow mt-1.5">{l}</div>
    </div>
  );
}
