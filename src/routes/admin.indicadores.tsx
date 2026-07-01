import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/indicadores")({ component: Page });

const groups = [
  {
    title: "Produto",
    items: [
      ["MAU", "1,842", "+8%"],
      ["DAU / MAU", "34%", "+2p"],
      ["Retenção 30d", "62%", "+3p"],
      ["Tempo médio de sessão", "7m12s", "+18s"],
    ],
  },
  {
    title: "Comercial",
    items: [
      ["MRR", "R$ 18.2K", "+9.4%"],
      ["Novos assinantes", "24", "+6"],
      ["Churn mensal", "2.1%", "-0.4p"],
      ["LTV / CAC", "4.6x", "+0.3x"],
    ],
  },
  {
    title: "IA & Matching",
    items: [
      ["Consultas / dia", "612", "+11%"],
      ["Latência p95", "1.2s", "-140ms"],
      ["Score médio", "72", "+3"],
      ["Cobertura de embeddings", "98.4%", "+1.1p"],
    ],
  },
];

function Page() {
  return (
    <div className="px-8 py-10">
      <div className="eyebrow mb-2">Analytics</div>
      <h1 className="text-3xl font-medium tracking-tight">Indicadores</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Métricas consolidadas de produto, comercial e desempenho da inteligência artificial.
      </p>

      <div className="mt-10 space-y-10">
        {groups.map((g) => (
          <section key={g.title}>
            <div className="eyebrow mb-3">{g.title}</div>
            <div className="grid grid-cols-2 hairline md:grid-cols-4">
              {g.items.map(([k, v, d], i) => (
                <div
                  key={k}
                  className={`p-5 ${i !== 0 ? "md:border-l border-[var(--hairline)]" : ""} ${
                    i >= 2 ? "border-t border-[var(--hairline)] md:border-t-0" : ""
                  }`}
                >
                  <div className="font-mono text-xl tracking-tight">{v}</div>
                  <div className="eyebrow mt-1.5">{k}</div>
                  <div className="mt-2 font-mono text-[10px] text-muted-foreground">{d}</div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
