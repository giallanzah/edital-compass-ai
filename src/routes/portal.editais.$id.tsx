import { createFileRoute, Link } from "@tanstack/react-router";
import { editais, formatBRL, daysUntil } from "@/data/editais";

export const Route = createFileRoute("/portal/editais/$id")({
  component: EditalDetail,
});

function EditalDetail() {
  const { id } = Route.useParams();
  const e = editais.find((x) => x.id === id);

  if (!e) {
    return (
      <div className="p-10 text-sm text-muted-foreground">
        Edital não encontrado.{" "}
        <Link to="/portal/editais" className="underline">
          Voltar ao catálogo
        </Link>
      </div>
    );
  }

  const d = daysUntil(e.deadline);

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <Link to="/portal/editais" className="eyebrow hover:text-foreground">
        ← Catálogo
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="hairline rounded-sm px-2 py-0.5 font-mono text-[11px]">{e.agency}</span>
        <span className="hairline rounded-sm px-2 py-0.5 font-mono text-[11px]">{e.modality}</span>
        <span className="hairline rounded-sm px-2 py-0.5 font-mono text-[11px]">{e.status}</span>
      </div>

      <h1 className="mt-4 text-3xl font-medium tracking-tight md:text-4xl">{e.title}</h1>
      <p className="mt-4 max-w-3xl text-base text-muted-foreground">{e.summary}</p>

      <div className="mt-8 grid grid-cols-2 hairline md:grid-cols-4">
        {[
          { k: "Match score", v: `${e.match}/100` },
          {
            k: "Recursos",
            v: e.amountMax ? `${formatBRL(e.amountMin)} – ${formatBRL(e.amountMax)}` : "Variável",
          },
          { k: "Prazo", v: d > 0 ? `${d} dias` : "encerrado" },
          { k: "Atualizado", v: new Date(e.updatedAt).toLocaleDateString("pt-BR") },
        ].map((s, i) => (
          <div
            key={s.k}
            className={`p-5 ${i !== 0 ? "border-l border-[var(--hairline)]" : ""}`}
          >
            <div className="font-mono text-lg">{s.v}</div>
            <div className="eyebrow mt-1">{s.k}</div>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-10">
          <section>
            <div className="eyebrow mb-3">Elegibilidade</div>
            <ul className="space-y-2 text-sm">
              {e.eligibility.map((x) => (
                <li key={x} className="flex gap-2">
                  <span className="text-muted-foreground">—</span>
                  {x}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <div className="eyebrow mb-3">Áreas-alvo</div>
            <div className="flex flex-wrap gap-2">
              {e.area.map((a) => (
                <span key={a} className="hairline rounded-sm px-2.5 py-1 text-xs">
                  {a}
                </span>
              ))}
            </div>
          </section>
          <section>
            <div className="eyebrow mb-3">Cronograma</div>
            <ol className="space-y-3 text-sm">
              {[
                ["Publicação", "12 Jun 2026"],
                ["Inscrições", "até " + new Date(e.deadline).toLocaleDateString("pt-BR")],
                ["Análise técnica", "60 dias após encerramento"],
                ["Divulgação", "estimada 90 dias"],
              ].map(([k, v]) => (
                <li key={k} className="flex justify-between hairline-b pb-2">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-mono text-xs">{v}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-3">
          <button className="inline-flex h-11 w-full items-center justify-center rounded-sm bg-foreground text-sm font-medium text-background hover:opacity-90">
            Iniciar candidatura
          </button>
          <button className="inline-flex h-11 w-full items-center justify-center rounded-sm hairline text-sm font-medium hover:bg-secondary">
            Salvar em projeto
          </button>
          <button className="inline-flex h-11 w-full items-center justify-center rounded-sm hairline text-sm font-medium hover:bg-secondary">
            Pedir consultoria
          </button>
          <div className="hairline mt-6 p-4">
            <div className="eyebrow mb-2">Documentos</div>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span>Edital completo</span>
                <span className="font-mono text-xs text-muted-foreground">PDF · 1.2MB</span>
              </li>
              <li className="flex justify-between">
                <span>Anexo I — Formulário</span>
                <span className="font-mono text-xs text-muted-foreground">DOCX</span>
              </li>
              <li className="flex justify-between">
                <span>Perguntas frequentes</span>
                <span className="font-mono text-xs text-muted-foreground">link</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
