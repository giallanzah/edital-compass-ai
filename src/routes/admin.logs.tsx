import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listarAuditLogAdmin } from "@/lib/admin.functions";
import { AdminErrorState } from "@/components/AdminErrorState";

export const Route = createFileRoute("/admin/logs")({ component: Page });

function Page() {
  const fn = useServerFn(listarAuditLogAdmin);
  const q = useQuery({ queryKey: ["admin", "audit-log"], queryFn: () => fn() });

  if (q.isError) return <AdminErrorState error={q.error as Error} />;
  const log = q.data ?? [];

  return (
    <div className="px-8 py-10">
      <div className="eyebrow mb-2">Auditoria</div>
      <h1 className="text-3xl font-medium tracking-tight">Logs</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Ações administrativas críticas registradas no banco: promoção de usuários, ativação/ pausa
        de fontes, disparo manual de coleta e moderação de editais. Mostrando os últimos 100
        eventos.
      </p>

      <div className="mt-8 hairline">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 hairline-b eyebrow">
          <div className="col-span-2">Horário</div>
          <div className="col-span-3">Ator</div>
          <div className="col-span-2">Ação</div>
          <div className="col-span-5">Detalhe</div>
        </div>
        {q.isLoading && (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando…</div>
        )}
        {!q.isLoading && log.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhum evento auditável ainda.
          </div>
        )}
        {log.map((l) => (
          <div
            key={l.id}
            className="grid grid-cols-12 items-center gap-4 px-5 py-3 hairline-b last:border-0 font-mono text-xs"
          >
            <div className="col-span-2 text-muted-foreground">
              {new Date(l.created_at).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="col-span-3">{l.actor_email}</div>
            <div className="col-span-2">
              <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] uppercase">
                {l.action}
              </span>
            </div>
            <div className="col-span-5 text-muted-foreground">{l.detail ?? "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
