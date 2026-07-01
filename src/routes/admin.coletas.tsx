import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listLogsColeta } from "@/lib/scrape.functions";

export const Route = createFileRoute("/admin/coletas")({ component: Page });

type Log = {
  id: string;
  fonte_slug: string;
  iniciado_em: string;
  finalizado_em: string | null;
  status: string;
  total_itens_lidos: number;
  total_novos: number;
  total_atualizados: number;
  total_ignorados: number;
  mensagem: string | null;
};

function Page() {
  const fn = useServerFn(listLogsColeta);
  const { data = [] as Log[] } = useQuery({
    queryKey: ["logs-coleta"],
    queryFn: () => fn() as Promise<Log[]>,
  });

  return (
    <div className="px-8 py-10">
      <div className="eyebrow mb-2">Robô Fomenta</div>
      <h1 className="text-3xl font-medium tracking-tight">Logs de coleta</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Histórico das últimas execuções do robô por fonte.
      </p>

      <div className="mt-8 hairline">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 hairline-b eyebrow">
          <div className="col-span-2">Fonte</div>
          <div className="col-span-2">Início</div>
          <div className="col-span-2">Fim</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">Lidos</div>
          <div className="col-span-1 text-right">Novos</div>
          <div className="col-span-1 text-right">Atual.</div>
          <div className="col-span-2">Mensagem</div>
        </div>
        {data.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma coleta executada ainda.
          </div>
        )}
        {data.map((l) => (
          <div
            key={l.id}
            className="grid grid-cols-12 items-center gap-4 px-5 py-3 hairline-b last:border-0 text-xs font-mono hover:bg-secondary"
          >
            <div className="col-span-2 uppercase">{l.fonte_slug}</div>
            <div className="col-span-2 text-muted-foreground">
              {new Date(l.iniciado_em).toLocaleString("pt-BR")}
            </div>
            <div className="col-span-2 text-muted-foreground">
              {l.finalizado_em ? new Date(l.finalizado_em).toLocaleString("pt-BR") : "—"}
            </div>
            <div className="col-span-1">{l.status}</div>
            <div className="col-span-1 text-right">{l.total_itens_lidos}</div>
            <div className="col-span-1 text-right">{l.total_novos}</div>
            <div className="col-span-1 text-right">{l.total_atualizados}</div>
            <div className="col-span-2 truncate text-muted-foreground" title={l.mensagem ?? ""}>
              {l.mensagem ?? "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
