import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/configuracoes")({
  component: Configs,
});

function Configs() {
  return (
    <div className="px-8 py-10 max-w-4xl">
      <div className="eyebrow mb-2">Sistema</div>
      <h1 className="text-3xl font-medium tracking-tight">Configurações</h1>

      <div className="mt-10 space-y-10">
        {[
          {
            title: "Geral",
            rows: [
              ["Nome da organização", "fomenta.ai"],
              ["Domínio", "app.fomenta.ai"],
              ["Fuso horário", "America/Sao_Paulo"],
            ],
          },
          {
            title: "IA & Matching",
            rows: [
              ["Modelo de embeddings", "text-embedding-3-large"],
              ["LLM de ranking", "claude-sonnet-4.5"],
              ["Limite de score (alerta)", "≥ 80"],
            ],
          },
          {
            title: "Notificações",
            rows: [
              ["E-mail diário", "ativo"],
              ["Webhook Slack", "—"],
              ["SMS (Pro+)", "desativado"],
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
