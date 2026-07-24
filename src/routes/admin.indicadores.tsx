import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { dashboardAdmin } from "@/lib/admin.functions";
import { AdminErrorState } from "@/components/AdminErrorState";

export const Route = createFileRoute("/admin/indicadores")({ component: Page });

function Page() {
  const fn = useServerFn(dashboardAdmin);
  const q = useQuery({ queryKey: ["admin", "dashboard"], queryFn: () => fn() });

  if (q.isError) return <AdminErrorState error={q.error as Error} />;
  const d = q.data;

  const groups = d
    ? [
        {
          title: "Plataforma",
          items: [
            ["Empresas cadastradas", d.empresas],
            ["Usuários cadastrados", d.usuarios],
            ["Projetos cadastrados", d.projetos],
            ["Editais ativos", d.editaisAtivos],
          ],
        },
        {
          title: "Candidaturas",
          items: [
            ["Rascunho", d.candidaturasPorEstagio.rascunho ?? 0],
            ["Aplicando", d.candidaturasPorEstagio.aplicando ?? 0],
            ["Em revisão", d.candidaturasPorEstagio.em_revisao ?? 0],
            ["Submetido", d.candidaturasPorEstagio.submetido ?? 0],
            ["Aprovado", d.candidaturasPorEstagio.aprovado ?? 0],
            ["Reprovado", d.candidaturasPorEstagio.reprovado ?? 0],
          ],
        },
        {
          title: "IA & conteúdo",
          items: [
            ["Resumos gerados", d.resumosGerados],
            ["Requisitos extraídos", d.requisitosGerados],
            ["Propostas geradas", d.propostasGeradas],
            ["Editais pendentes de revisão", d.editaisPrecisamRevisao],
          ],
        },
      ]
    : [];

  return (
    <div className="px-8 py-10">
      <div className="eyebrow mb-2">Analytics</div>
      <h1 className="text-3xl font-medium tracking-tight">Indicadores</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Contagens reais extraídas diretamente do banco — sem estimativas.
      </p>

      {q.isLoading && <div className="mt-8 text-sm text-muted-foreground">Carregando…</div>}

      <div className="mt-10 space-y-10">
        {groups.map((g) => (
          <section key={g.title}>
            <div className="eyebrow mb-3">{g.title}</div>
            <div className="grid grid-cols-2 hairline md:grid-cols-4">
              {g.items.map(([k, v], i) => (
                <div
                  key={k as string}
                  className={`p-5 ${i !== 0 ? "md:border-l border-[var(--hairline)]" : ""} ${
                    i >= 2 ? "border-t border-[var(--hairline)] md:border-t-0" : ""
                  }`}
                >
                  <div className="font-mono text-xl tracking-tight">
                    {(v as number).toLocaleString("pt-BR")}
                  </div>
                  <div className="eyebrow mt-1.5">{k}</div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10 hairline p-5 text-xs text-muted-foreground">
        <div className="eyebrow mb-2">Fora do escopo atual</div>
        Métricas comerciais (MRR, churn, LTV/CAC) e de produto (MAU, retenção, tempo de sessão)
        dependem de integração de billing e de analytics de uso, que ainda não existem na plataforma
        — por isso não aparecem aqui.
      </div>
    </div>
  );
}
