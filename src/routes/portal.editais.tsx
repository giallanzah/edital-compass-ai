import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { EditalCard } from "@/components/EditalCard";
import { editais, agencies } from "@/data/editais";

export const Route = createFileRoute("/portal/editais")({
  component: EditaisList,
});

const modalities = ["Subvenção", "Crédito", "Bolsa", "Incentivo Fiscal", "Equity"];

function EditaisList() {
  const [q, setQ] = useState("");
  const [agency, setAgency] = useState<string | null>(null);
  const [modality, setModality] = useState<string | null>(null);

  const filtered = editais.filter((e) => {
    if (agency && e.agency !== agency) return false;
    if (modality && e.modality !== modality) return false;
    if (q && !`${e.title} ${e.summary}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <div className="eyebrow mb-2">Catálogo</div>
      <h1 className="text-3xl font-medium tracking-tight">Editais & linhas de fomento</h1>

      {/* Search */}
      <div className="mt-8 hairline flex items-center bg-card">
        <span className="px-4 font-mono text-xs text-muted-foreground">⌕</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por área, palavra-chave, projeto..."
          className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button className="border-l border-[var(--hairline)] px-5 text-sm">Filtros avançados</button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        {/* Sidebar filters */}
        <aside className="space-y-8">
          <div>
            <div className="eyebrow mb-3">Órgão</div>
            <ul className="space-y-1.5 text-sm">
              <li>
                <button
                  onClick={() => setAgency(null)}
                  className={`flex w-full justify-between ${
                    !agency ? "font-medium" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>Todos</span>
                  <span className="font-mono text-xs text-muted-foreground">{editais.length}</span>
                </button>
              </li>
              {agencies.map((a) => (
                <li key={a.name}>
                  <button
                    onClick={() => setAgency(a.name)}
                    className={`flex w-full justify-between ${
                      agency === a.name ? "font-medium" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{a.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{a.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="eyebrow mb-3">Modalidade</div>
            <ul className="space-y-1.5 text-sm">
              <li>
                <button
                  onClick={() => setModality(null)}
                  className={!modality ? "font-medium" : "text-muted-foreground hover:text-foreground"}
                >
                  Todas
                </button>
              </li>
              {modalities.map((m) => (
                <li key={m}>
                  <button
                    onClick={() => setModality(m)}
                    className={
                      modality === m ? "font-medium" : "text-muted-foreground hover:text-foreground"
                    }
                  >
                    {m}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Results */}
        <div>
          <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-mono">{filtered.length} resultados</span>
            <span>Ordenar por: <button className="text-foreground">Match score ↓</button></span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((e) => (
              <EditalCard key={e.id} e={e} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="hairline p-12 text-center text-sm text-muted-foreground">
              Nenhum edital encontrado com esses filtros.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
