import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { dashboardAdmin } from "@/lib/admin.functions";
import { AdminErrorState } from "@/components/AdminErrorState";

export const Route = createFileRoute("/admin/ia")({ component: Page });

function Page() {
  const fn = useServerFn(dashboardAdmin);
  const q = useQuery({ queryKey: ["admin", "dashboard"], queryFn: () => fn() });

  if (q.isError) return <AdminErrorState error={q.error as Error} />;
  const d = q.data;

  return (
    <div className="px-8 py-10 max-w-4xl">
      <div className="eyebrow mb-2">Inteligência artificial</div>
      <h1 className="text-3xl font-medium tracking-tight">IA</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Configuração real do gateway usado por resumo, requisitos, análise de aderência e geração de
        proposta (ver <code className="font-mono text-xs">src/lib/ai.functions.ts</code> e{" "}
        <code className="font-mono text-xs">ai-gateway.server.ts</code>).
      </p>

      <div className="mt-10 space-y-10">
        <section>
          <div className="eyebrow mb-3">Modelos em uso</div>
          <div className="hairline divide-y divide-[var(--hairline)]">
            {[
              ["Resumo do edital", "google/gemini-2.5-flash"],
              ["Extração de requisitos", "google/gemini-2.5-flash"],
              ["Análise de aderência", "google/gemini-2.5-pro"],
              ["Geração de proposta", "google/gemini-2.5-pro"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-mono text-xs">{v}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="eyebrow mb-3">Limites configurados</div>
          <div className="hairline divide-y divide-[var(--hairline)]">
            {[
              ["Provedor", "Lovable AI Gateway"],
              ["Máx. tokens por resposta (padrão)", "1.200"],
              ["Máx. tokens (geração de proposta)", "3.500"],
              ["Formato forçado (resumo/requisitos/aderência)", "JSON"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-mono text-xs">{v}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="eyebrow mb-3">Uso (contagem real, acumulado)</div>
          {q.isLoading ? (
            <div className="text-sm text-muted-foreground">Carregando…</div>
          ) : (
            <div className="hairline divide-y divide-[var(--hairline)]">
              <Row k="Resumos de edital gerados e cacheados" v={d?.resumosGerados ?? 0} />
              <Row k="Editais com requisitos extraídos" v={d?.requisitosGerados ?? 0} />
              <Row k="Propostas de candidatura geradas" v={d?.propostasGeradas ?? 0} />
            </div>
          )}
        </section>

        <div className="hairline p-5 text-xs text-muted-foreground">
          <div className="eyebrow mb-2">Fora do escopo atual</div>
          Não há rastreamento de tokens consumidos, custo por chamada, filtro de PII ou bloqueio de
          prompt injection implementados no gateway hoje — nenhum desses controles existe no código,
          então não aparecem como métricas ou toggles nesta página.
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: number }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-mono text-xs">{v.toLocaleString("pt-BR")}</span>
    </div>
  );
}
