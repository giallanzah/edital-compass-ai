import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listFontesComUltimaColeta } from "@/lib/scrape.functions";
import { AdminErrorState } from "@/components/AdminErrorState";

export const Route = createFileRoute("/admin/scrapers")({ component: Scrapers });

type UltimaColeta = {
  iniciado_em: string;
  finalizado_em: string | null;
  status: string;
  total_novos: number;
} | null;

type FonteJob = {
  id: string;
  slug: string;
  nome: string;
  ativo: boolean;
  frequencia_horas: number;
  status_coleta: string;
  ultimaColeta: UltimaColeta;
};

function Scrapers() {
  const fn = useServerFn(listFontesComUltimaColeta);
  const {
    data = [] as FonteJob[],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin", "scrapers"],
    queryFn: () => fn() as Promise<FonteJob[]>,
  });

  if (isError) return <AdminErrorState error={error as Error} />;

  return (
    <div className="px-8 py-10">
      <div className="eyebrow mb-2">Pipelines</div>
      <h1 className="text-3xl font-medium tracking-tight">Scrapers</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Estado real de cada job de coleta: agendamento configurado, status da última execução e
        itens novos encontrados. Para pausar/ativar ou rodar uma coleta agora, use{" "}
        <Link to="/admin/fontes" className="underline hover:text-foreground">
          Fontes monitoradas
        </Link>
        ; para o histórico completo, veja{" "}
        <Link to="/admin/coletas" className="underline hover:text-foreground">
          Logs de coleta
        </Link>
        .
      </p>

      <div className="mt-8 hairline">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 hairline-b eyebrow">
          <div className="col-span-3">Job</div>
          <div className="col-span-2">Schedule</div>
          <div className="col-span-2">Última execução</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Novos</div>
          <div className="col-span-2 text-right">Ativa</div>
        </div>
        {isLoading && (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando…</div>
        )}
        {!isLoading && data.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma fonte cadastrada.
          </div>
        )}
        {data.map((s) => (
          <div
            key={s.id}
            className="grid grid-cols-12 items-center gap-4 px-5 py-3 hairline-b last:border-0 font-mono text-xs"
          >
            <div className="col-span-3 text-foreground">{s.slug}.crawl</div>
            <div className="col-span-2 text-muted-foreground">a cada {s.frequencia_horas}h</div>
            <div className="col-span-2 text-muted-foreground">
              {s.ultimaColeta
                ? new Date(s.ultimaColeta.iniciado_em).toLocaleString("pt-BR")
                : "nunca"}
            </div>
            <div className="col-span-2">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    s.status_coleta === "ok" ? "bg-foreground" : "bg-destructive"
                  }`}
                />
                {s.status_coleta}
              </span>
            </div>
            <div className="col-span-1 text-right">{s.ultimaColeta?.total_novos ?? "—"}</div>
            <div className="col-span-2 text-right text-muted-foreground">
              {s.ativo ? "sim" : "pausada"}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 hairline p-5 text-xs text-muted-foreground">
        <div className="eyebrow mb-2">Agendamento automático</div>
        Endpoint: <code className="font-mono">POST /api/public/cron/scrape</code> com header{" "}
        <code className="font-mono">apikey: SUPABASE_ANON_KEY</code>. Cadastre no{" "}
        <code>pg_cron</code> ou cron externo com o intervalo desejado — as colunas de frequência
        acima são apenas o SLA declarado por fonte, não um cron interno da aplicação.
      </div>
    </div>
  );
}
