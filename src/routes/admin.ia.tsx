import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/ia")({ component: Page });

function Page() {
  return (
    <div className="px-8 py-10 max-w-4xl">
      <div className="eyebrow mb-2">Inteligência artificial</div>
      <h1 className="text-3xl font-medium tracking-tight">IA</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Configuração dos modelos de matching, ranking e geração de respostas.
      </p>

      <div className="mt-10 space-y-10">
        {[
          {
            title: "Modelos",
            rows: [
              ["Embeddings", "text-embedding-3-large · 3072d"],
              ["Ranking", "claude-sonnet-4.5"],
              ["Geração longa", "gpt-5.1-mini"],
              ["Speech-to-text", "whisper-large-v3"],
            ],
          },
          {
            title: "Guardrails",
            rows: [
              ["Máx. tokens por resposta", "1,200"],
              ["Filtro de PII", "ativo"],
              ["Bloqueio de prompt injection", "ativo"],
              ["Logs de prompt", "30 dias"],
            ],
          },
          {
            title: "Custos (30d)",
            rows: [
              ["Tokens de entrada", "82.4M"],
              ["Tokens de saída", "14.1M"],
              ["Custo total", "R$ 3.240,00"],
            ],
          },
        ].map((g) => (
          <section key={g.title}>
            <div className="eyebrow mb-3">{g.title}</div>
            <div className="hairline divide-y divide-[var(--hairline)]">
              {g.rows.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-mono text-xs">{v}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
