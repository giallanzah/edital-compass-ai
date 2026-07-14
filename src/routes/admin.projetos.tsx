import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { listarProjetosAdmin } from "@/lib/admin.functions";
import { AdminErrorState } from "@/components/AdminErrorState";

export const Route = createFileRoute("/admin/projetos")({ component: Page });

type Projeto = {
  id: string;
  nome: string;
  descricao: string | null;
  user_id: string;
  created_at: string;
  candidaturas: { total: number; ativos: number };
};

function Page() {
  const fn = useServerFn(listarProjetosAdmin);
  const q = useQuery({ queryKey: ["admin", "projetos"], queryFn: () => fn() });
  const [filtro, setFiltro] = useState<"todos" | "com_ativa" | "sem_candidatura">("todos");

  const rows = (q.data ?? []) as Projeto[];
  const filtradas = useMemo(() => {
    if (filtro === "todos") return rows;
    if (filtro === "com_ativa") return rows.filter((r) => r.candidaturas.ativos > 0);
    return rows.filter((r) => r.candidaturas.total === 0);
  }, [rows, filtro]);

  if (q.isError) return <AdminErrorState error={q.error as Error} />;

  return (
    <div className="px-8 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-2">Pipeline</div>
          <h1 className="text-3xl font-medium tracking-tight">Projetos</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Projetos cadastrados pelas empresas e candidaturas vinculadas.
          </p>
        </div>
        <div className="flex gap-1 rounded-sm hairline p-1 font-mono text-[10px] uppercase">
          {(["todos", "com_ativa", "sem_candidatura"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFiltro(k)}
              className={`rounded-sm px-2 py-1 tracking-wider ${
                filtro === k ? "bg-foreground text-background" : "text-muted-foreground"
              }`}
            >
              {k === "todos" ? "todos" : k === "com_ativa" ? "com ativa" : "sem candidatura"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 hairline">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 hairline-b eyebrow">
          <div className="col-span-5">Projeto</div>
          <div className="col-span-3">User</div>
          <div className="col-span-2 text-right">Candidaturas</div>
          <div className="col-span-2 text-right">Criado</div>
        </div>
        {q.isLoading ? (
          <div className="p-5 text-sm text-muted-foreground">Carregando…</div>
        ) : filtradas.length === 0 ? (
          <div className="p-5 text-sm text-muted-foreground">Nenhum projeto.</div>
        ) : (
          filtradas.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-12 items-center gap-4 px-5 py-3 hairline-b text-sm last:border-0"
            >
              <div className="col-span-5">
                <div className="font-medium">{p.nome}</div>
                {p.descricao && (
                  <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {p.descricao}
                  </div>
                )}
              </div>
              <div className="col-span-3 font-mono text-[10px] text-muted-foreground">
                {p.user_id.slice(0, 8)}…
              </div>
              <div className="col-span-2 text-right font-mono text-xs">
                {p.candidaturas.total}{" "}
                <span className="text-muted-foreground">({p.candidaturas.ativos} ativas)</span>
              </div>
              <div className="col-span-2 text-right font-mono text-xs text-muted-foreground">
                {new Date(p.created_at).toLocaleDateString("pt-BR")}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
