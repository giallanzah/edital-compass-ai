import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const kpis = [
  { k: "Editais ativos", v: "412", delta: "+18 / 7d" },
  { k: "Usuários", v: "2,847", delta: "+143 / 7d" },
  { k: "Assinantes Pro", v: "184", delta: "+12 / 7d" },
  { k: "MRR", v: "R$ 18.2K", delta: "+9.4% / 30d" },
];

const log = [
  { t: "02:14", src: "CNPq", msg: "Scraper concluído · 47 editais · 3 novos" },
  { t: "02:08", src: "FINEP", msg: "Scraper concluído · 32 editais · 1 novo" },
  { t: "01:55", src: "FAPESP", msg: "Scraper concluído · 41 editais" },
  { t: "01:30", src: "BNDES", msg: "Falha de parsing · retry agendado" },
  { t: "00:45", src: "system", msg: "Reindex de embeddings finalizado (12s)" },
];

function AdminDashboard() {
  return (
    <div className="px-8 py-10">
      <div className="eyebrow mb-2">Backoffice</div>
      <h1 className="text-3xl font-medium tracking-tight">Visão geral</h1>

      <div className="mt-8 grid grid-cols-2 hairline md:grid-cols-4">
        {kpis.map((s, i) => (
          <div
            key={s.k}
            className={`p-5 ${i !== 0 ? "md:border-l border-[var(--hairline)]" : ""} ${
              i >= 2 ? "border-t border-[var(--hairline)] md:border-t-0" : ""
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
        </section>

        <section>
          <h2 className="mb-4 text-sm font-medium">Log de execução</h2>
          <div className="hairline divide-y divide-[var(--hairline)] font-mono text-xs">
            {log.map((l, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                <span className="text-muted-foreground">{l.t}</span>
                <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] uppercase">
                  {l.src}
                </span>
                <span className="flex-1 text-foreground">{l.msg}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
