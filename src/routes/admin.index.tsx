import { createFileRoute } from "@tanstack/react-router";
import { getAuditLog } from "@/lib/adminAuth";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const kpis = [
  { k: "Empresas cadastradas", v: "1,284", delta: "+42 / 7d" },
  { k: "Empresas ativas", v: "864", delta: "67% do total" },
  { k: "Usuários cadastrados", v: "2,847", delta: "+143 / 7d" },
  { k: "Projetos ativos", v: "512", delta: "+28 / 7d" },
  { k: "Editais ativos", v: "412", delta: "+18 / 7d" },
  { k: "Consultas IA", v: "18,204", delta: "últimos 30d" },
  { k: "Receita da plataforma", v: "R$ 218K", delta: "MRR R$ 18.2K" },
  { k: "Alertas do sistema", v: "3", delta: "1 crítico" },
];

const statusRows = [
  ["API pública", "operacional", "99.98%"],
  ["Pipeline de scrapers", "operacional", "8/9 jobs"],
  ["Gateway de IA", "operacional", "p95 1.2s"],
  ["Banco de dados", "operacional", "12ms lat."],
  ["Fila de e-mails", "atenção", "backlog 340"],
];

const alerts = [
  { level: "crit", msg: "bndes.crawl · 3 falhas consecutivas", t: "há 12min" },
  { level: "warn", msg: "fapemig.crawl · parsing degradado", t: "há 2h" },
  { level: "info", msg: "Reindex de embeddings agendado 03:00 UTC", t: "hoje" },
];

function AdminDashboard() {
  const [audit, setAudit] = useState<ReturnType<typeof getAuditLog>>([]);
  useEffect(() => setAudit(getAuditLog()), []);

  return (
    <div className="px-8 py-10">
      <div className="eyebrow mb-2">Backoffice · dashboard</div>
      <h1 className="text-3xl font-medium tracking-tight">Visão geral da plataforma</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Indicadores operacionais, receita, status dos serviços e últimos acessos administrativos.
      </p>

      <div className="mt-8 grid grid-cols-2 hairline md:grid-cols-4">
        {kpis.map((s, i) => (
          <div
            key={s.k}
            className={`p-5 ${i % 4 !== 0 ? "md:border-l border-[var(--hairline)]" : ""} ${
              i >= 4 ? "border-t border-[var(--hairline)]" : i >= 2 ? "border-t border-[var(--hairline)] md:border-t-0" : ""
            }`}
          >
            <div className="font-mono text-2xl tracking-tight">{s.v}</div>
            <div className="eyebrow mt-1.5">{s.k}</div>
            <div className="mt-2 font-mono text-[10px] text-muted-foreground">{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-medium">Editais ingeridos · últimos 14 dias</h2>
          <div className="hairline p-6">
            <div className="flex h-48 items-end gap-1">
              {[18, 22, 14, 26, 19, 31, 24, 28, 17, 33, 21, 29, 38, 27].map((v, i) => (
                <div
                  key={i}
                  className="flex-1 bg-foreground/85 transition-colors hover:bg-foreground"
                  style={{ height: `${(v / 38) * 100}%` }}
                />
              ))}
            </div>
            <div className="mt-3 flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>04 jun</span>
              <span>18 jun</span>
            </div>
          </div>

          <h2 className="mb-4 mt-10 text-sm font-medium">Status geral da plataforma</h2>
          <div className="hairline divide-y divide-[var(--hairline)] text-sm">
            {statusRows.map(([svc, st, meta]) => (
              <div key={svc} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      st === "operacional" ? "bg-foreground" : "bg-muted-foreground"
                    }`}
                  />
                  <span>{svc}</span>
                </div>
                <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground">
                  <span className="uppercase">{st}</span>
                  <span>{meta}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-10">
          <div>
            <h2 className="mb-4 text-sm font-medium">Alertas do sistema</h2>
            <div className="hairline divide-y divide-[var(--hairline)]">
              {alerts.map((a, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase ${
                        a.level === "crit"
                          ? "bg-destructive text-destructive-foreground"
                          : a.level === "warn"
                          ? "hairline"
                          : "bg-secondary"
                      }`}
                    >
                      {a.level}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">{a.t}</span>
                  </div>
                  <div className="mt-1.5 text-sm">{a.msg}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-medium">Últimos acessos</h2>
            <div className="hairline divide-y divide-[var(--hairline)] font-mono text-xs">
              {(audit.length ? audit : [{ ts: new Date().toISOString(), actor: "—", action: "—", detail: "Nenhum evento ainda" }])
                .slice(0, 8)
                .map((l, i) => (
                  <div key={i} className="px-4 py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground">{l.actor}</span>
                      <span className="text-muted-foreground">
                        {new Date(l.ts).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="mt-0.5 text-muted-foreground">
                      <span className="uppercase">{l.action}</span> · {l.detail}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
