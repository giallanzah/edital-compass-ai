type Col = string;

export function AdminStubPage({
  eyebrow,
  title,
  description,
  columns = ["Nome", "Referência", "Status", "Atualizado"],
  rows,
  cta = "+ Novo registro",
}: {
  eyebrow: string;
  title: string;
  description: string;
  columns?: Col[];
  rows?: string[][];
  cta?: string;
}) {
  const data =
    rows ??
    Array.from({ length: 6 }).map((_, i) => [
      `${title} #${String(i + 1).padStart(3, "0")}`,
      `REF-${(1000 + i).toString(36).toUpperCase()}`,
      i % 3 === 0 ? "Ativo" : i % 3 === 1 ? "Revisão" : "Arquivado",
      `${(i + 1) * 3}/06/2026`,
    ]);

  return (
    <div className="px-8 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-2">{eyebrow}</div>
          <h1 className="text-3xl font-medium tracking-tight">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex h-9 items-center rounded-sm hairline px-4 text-sm hover:bg-secondary">
            Exportar
          </button>
          <button className="inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-sm font-medium text-background">
            {cta}
          </button>
        </div>
      </div>

      <div className="mt-8 hairline">
        <div
          className="grid gap-4 px-5 py-3 hairline-b eyebrow"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0,1fr))` }}
        >
          {columns.map((c) => (
            <div key={c}>{c}</div>
          ))}
        </div>
        {data.map((row, i) => (
          <div
            key={i}
            className="grid gap-4 px-5 py-3.5 hairline-b last:border-0 text-sm hover:bg-secondary"
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0,1fr))` }}
          >
            {row.map((cell, j) => (
              <div
                key={j}
                className={j === 0 ? "font-medium" : "font-mono text-xs text-muted-foreground"}
              >
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
