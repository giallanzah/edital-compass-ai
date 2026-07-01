import { createFileRoute } from "@tanstack/react-router";
import { getAuditLog } from "@/lib/adminAuth";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/admin/logs")({ component: Page });

function Page() {
  const [log, setLog] = useState<ReturnType<typeof getAuditLog>>([]);
  useEffect(() => setLog(getAuditLog()), []);

  return (
    <div className="px-8 py-10">
      <div className="eyebrow mb-2">Auditoria</div>
      <h1 className="text-3xl font-medium tracking-tight">Logs</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Registro imutável de todas as ações administrativas — logins, alterações e execuções de
        jobs. Retenção: 12 meses.
      </p>

      <div className="mt-8 hairline">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 hairline-b eyebrow">
          <div className="col-span-2">Horário</div>
          <div className="col-span-3">Ator</div>
          <div className="col-span-2">Ação</div>
          <div className="col-span-5">Detalhe</div>
        </div>
        {(log.length
          ? log
          : [
              {
                ts: new Date().toISOString(),
                actor: "system",
                action: "seed",
                detail: "Nenhum evento auditável ainda — faça login para gerar registros.",
              },
            ]
        ).map((l, i) => (
          <div
            key={i}
            className="grid grid-cols-12 items-center gap-4 px-5 py-3 hairline-b last:border-0 font-mono text-xs"
          >
            <div className="col-span-2 text-muted-foreground">
              {new Date(l.ts).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="col-span-3">{l.actor}</div>
            <div className="col-span-2">
              <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] uppercase">
                {l.action}
              </span>
            </div>
            <div className="col-span-5 text-muted-foreground">{l.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
