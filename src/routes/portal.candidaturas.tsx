import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/portal/candidaturas")({
  component: Candidaturas,
});

const rows = [
  { proj: "Plataforma IoT ambiental", edital: "FAPESP PIPE 2", status: "Submetido", date: "10/06/2026" },
  { proj: "Manutenção preditiva", edital: "FINEP Mais Inovação", status: "Em revisão", date: "02/06/2026" },
  { proj: "Bioplástico agrícola", edital: "CNPq Universal", status: "Rascunho", date: "—" },
  { proj: "Diagnóstico por imagem", edital: "FINEP Saúde", status: "Aprovado", date: "12/04/2026" },
  { proj: "Energia comunitária", edital: "BNDES Clima", status: "Rejeitado", date: "18/02/2026" },
];

const cols = [
  ["Rascunho", 1],
  ["Submetido", 1],
  ["Em revisão", 1],
  ["Aprovado", 1],
  ["Rejeitado", 1],
] as const;

function Candidaturas() {
  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <div className="eyebrow mb-2">Acompanhamento</div>
      <h1 className="text-3xl font-medium tracking-tight">Candidaturas</h1>

      <div className="mt-8 grid grid-cols-5 hairline">
        {cols.map(([name], i) => {
          const items = rows.filter((r) => r.status === name);
          return (
            <div
              key={name}
              className={`min-h-[300px] p-3 ${i !== 0 ? "border-l border-[var(--hairline)]" : ""}`}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="eyebrow">{name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((r) => (
                  <div key={r.proj} className="hairline bg-card p-3">
                    <div className="text-xs font-medium leading-snug">{r.proj}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{r.edital}</div>
                    <div className="mt-2 font-mono text-[10px] text-muted-foreground">{r.date}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
