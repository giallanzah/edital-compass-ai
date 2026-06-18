import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/portal/conhecimento")({
  component: Conhecimento,
});

const articles = [
  { t: "Como estruturar um projeto de PD&I para a Lei do Bem", cat: "Lei do Bem", min: 12 },
  { t: "Diferenças entre subvenção, crédito e equity em fomento", cat: "Fundamentos", min: 8 },
  { t: "Guia rápido: Chamada Universal CNPq", cat: "CNPq", min: 6 },
  { t: "Como compor consórcios entre empresa e ICT", cat: "Parcerias", min: 10 },
  { t: "Métricas de impacto que aumentam aprovação", cat: "Avaliação", min: 9 },
  { t: "Erros mais comuns em propostas para FINEP", cat: "FINEP", min: 7 },
];

function Conhecimento() {
  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <div className="eyebrow mb-2">Aprenda</div>
      <h1 className="text-3xl font-medium tracking-tight">Base de conhecimento</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Guias práticos, frameworks e estudos de caso para aumentar suas chances de captação.
      </p>

      <div className="mt-10 grid gap-px bg-[var(--hairline)] hairline md:grid-cols-2">
        {articles.map((a) => (
          <a
            key={a.t}
            href="#"
            className="block bg-background p-6 transition-colors hover:bg-secondary"
          >
            <div className="eyebrow mb-3">{a.cat}</div>
            <div className="text-base font-medium leading-snug">{a.t}</div>
            <div className="mt-4 font-mono text-[10px] text-muted-foreground">
              {a.min} min de leitura
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
