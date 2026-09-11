import type { ModoTexto } from "@/lib/ai.functions";

const MODOS: Array<{ modo: ModoTexto; label: string; hint: string }> = [
  { modo: "organizar", label: "Organizar", hint: "Estrutura e clareza, sem inventar dados" },
  { modo: "evoluir", label: "Evoluir", hint: "Aprofunda e detalha os argumentos" },
  { modo: "revisar", label: "Revisar", hint: "Gramática, tom e coesão" },
];

export function BarraIA({
  disabled,
  pending,
  error,
  podeDesfazer,
  onModo,
  onDesfazer,
}: {
  disabled?: boolean;
  pending?: boolean;
  error?: Error | null;
  podeDesfazer?: boolean;
  onModo: (modo: ModoTexto) => void;
  onDesfazer: () => void;
}) {
  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          IA de texto
        </span>
        {MODOS.map((m) => (
          <button
            key={m.modo}
            type="button"
            title={m.hint}
            disabled={disabled || pending}
            onClick={() => onModo(m.modo)}
            className="inline-flex h-8 items-center rounded-sm hairline px-3 text-xs hover:bg-secondary disabled:opacity-40"
          >
            {m.label}
          </button>
        ))}
        {podeDesfazer && !pending && (
          <button
            type="button"
            onClick={onDesfazer}
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            desfazer
          </button>
        )}
        {pending && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            processando…
          </span>
        )}
      </div>
      {error && <div className="mt-2 text-xs text-destructive">{error.message}</div>}
    </div>
  );
}
