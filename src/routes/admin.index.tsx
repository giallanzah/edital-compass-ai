import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { dashboardAdmin, listarAuditLogAdmin } from "@/lib/admin.functions";
import { AdminErrorState } from "@/components/AdminErrorState";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

const ESTAGIO_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  aplicando: "Aplicando",
  em_revisao: "Em revisão",
  submetido: "Submetido",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
};

function last14Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function AdminDashboard() {
  const dashFn = useServerFn(dashboardAdmin);
  const auditFn = useServerFn(listarAuditLogAdmin);

  const dashQ = useQuery({ queryKey: ["admin", "dashboard"], queryFn: () => dashFn() });
  const auditQ = useQuery({
    queryKey: ["admin", "audit-log", "dashboard"],
    queryFn: () => auditFn(),
  });

  if (dashQ.isError) return <AdminErrorState error={dashQ.error as Error} />;

  const d = dashQ.data;
  const dias = last14Days();
  const serie = dias.map((dia) => d?.editaisPorDia[dia] ?? 0);
  const maxSerie = Math.max(1, ...serie);

  const propostoAtivo = ["rascunho", "aplicando", "em_revisao"].reduce(
    (acc, k) => acc + (d?.candidaturasPorEstagio[k] ?? 0),
    0,
  );

  const kpis = d
    ? [
        { k: "Empresas cadastradas", v: d.empresas },
        { k: "Usuários cadastrados", v: d.usuarios },
        { k: "Projetos cadastrados", v: d.projetos },
        { k: "Editais ativos", v: d.editaisAtivos },
        { k: "Candidaturas em andamento", v: propostoAtivo },
        { k: "Resumos gerados por IA", v: d.resumosGerados },
        { k: "Propostas geradas por IA", v: d.propostasGeradas },
        { k: "Editais pendentes de revisão", v: d.editaisPrecisamRevisao },
      ]
    : [];

  const fontesComFalha = (d?.fontes ?? []).filter((f) => f.status_coleta !== "ok");

  return (
    <div className="px-8 py-10">
      <div className="eyebrow mb-2">Backoffice · dashboard</div>
      <h1 className="text-3xl font-medium tracking-tight">Visão geral da plataforma</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Contagens reais direto do banco: cadastros, editais, candidaturas, uso de IA e status das
        fontes de coleta.
      </p>

      {dashQ.isLoading ? (
        <div className="mt-8 text-sm text-muted-foreground">Carregando…</div>
      ) : (
        <div className="mt-8 grid grid-cols-2 hairline md:grid-cols-4">
          {kpis.map((s, i) => (
            <div
              key={s.k}
              className={`p-5 ${i % 4 !== 0 ? "md:border-l border-[var(--hairline)]" : ""} ${
                i >= 4
                  ? "border-t border-[var(--hairline)]"
                  : i >= 2
                    ? "border-t border-[var(--hairline)] md:border-t-0"
                    : ""
              }`}
            >
              <div className="font-mono text-2xl tracking-tight">{s.v.toLocaleString("pt-BR")}</div>
              <div className="eyebrow mt-1.5">{s.k}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-medium">Editais coletados · últimos 14 dias</h2>
          <div className="hairline p-6">
            <div className="flex h-48 items-end gap-1">
              {serie.map((v, i) => (
                <div
                  key={dias[i]}
                  title={`${dias[i]}: ${v}`}
                  className="flex-1 bg-foreground/85 transition-colors hover:bg-foreground"
                  style={{ height: `${Math.max(2, (v / maxSerie) * 100)}%` }}
                />
              ))}
            </div>
            <div className="mt-3 flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>{dias[0]?.split("-").reverse().slice(0, 2).join("/")}</span>
              <span>{dias[dias.length - 1]?.split("-").reverse().slice(0, 2).join("/")}</span>
            </div>
          </div>

          <h2 className="mb-4 mt-10 text-sm font-medium">Status das fontes monitoradas</h2>
          <div className="hairline divide-y divide-[var(--hairline)] text-sm">
            {(d?.fontes ?? []).map((f) => (
              <div key={f.slug as string} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      f.status_coleta === "ok" ? "bg-foreground" : "bg-destructive"
                    }`}
                  />
                  <span>{f.nome as string}</span>
                  {!f.ativo && (
                    <span className="rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-[9px] uppercase text-muted-foreground">
                      pausada
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground">
                  <span className="uppercase">{f.status_coleta as string}</span>
                  <span>
                    {f.ultimo_sucesso_em
                      ? new Date(f.ultimo_sucesso_em as string).toLocaleString("pt-BR")
                      : "nunca coletado"}
                  </span>
                </div>
              </div>
            ))}
            {(d?.fontes ?? []).length === 0 && (
              <div className="px-5 py-3 text-sm text-muted-foreground">
                Nenhuma fonte cadastrada.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-10">
          <div>
            <h2 className="mb-4 text-sm font-medium">Alertas</h2>
            <div className="hairline divide-y divide-[var(--hairline)]">
              {fontesComFalha.length === 0 && (d?.editaisPrecisamRevisao ?? 0) === 0 && (
                <div className="px-4 py-3 text-sm text-muted-foreground">Nenhum alerta ativo.</div>
              )}
              {fontesComFalha.map((f) => (
                <div key={f.slug as string} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-sm bg-destructive px-1.5 py-0.5 font-mono text-[10px] uppercase text-destructive-foreground">
                      falha
                    </span>
                  </div>
                  <div className="mt-1.5 text-sm">
                    {f.nome as string}: {(f.ultima_mensagem as string) || "erro na última coleta"}
                  </div>
                </div>
              ))}
              {(d?.editaisPrecisamRevisao ?? 0) > 0 && (
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-sm hairline px-1.5 py-0.5 font-mono text-[10px] uppercase">
                      revisão
                    </span>
                  </div>
                  <div className="mt-1.5 text-sm">
                    {d?.editaisPrecisamRevisao} edital(is) marcado(s) para revisão manual
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-medium">Candidaturas por estágio</h2>
            <div className="hairline divide-y divide-[var(--hairline)] text-sm">
              {Object.entries(ESTAGIO_LABEL).map(([k, label]) => (
                <div key={k} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-mono text-xs">{d?.candidaturasPorEstagio[k] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-medium">Últimos acessos administrativos</h2>
            <div className="hairline divide-y divide-[var(--hairline)] font-mono text-xs">
              {(auditQ.data?.length ? auditQ.data : []).slice(0, 8).map((l) => (
                <div key={l.id} className="px-4 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">{l.actor_email}</span>
                    <span className="text-muted-foreground">
                      {new Date(l.created_at).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="mt-0.5 text-muted-foreground">
                    <span className="uppercase">{l.action}</span>
                    {l.detail ? ` · ${l.detail}` : ""}
                  </div>
                </div>
              ))}
              {!auditQ.data?.length && (
                <div className="px-4 py-2.5 text-muted-foreground">
                  Nenhum evento auditável ainda.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
