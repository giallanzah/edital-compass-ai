import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { listarEmpresasAdmin } from "@/lib/admin.functions";
import { AdminErrorState } from "@/components/AdminErrorState";

export const Route = createFileRoute("/admin/empresas")({ component: Page });

type Empresa = {
  id: string;
  user_id: string;
  nome_empresa: string;
  cnpj: string | null;
  setor: string | null;
  porte: string | null;
  uf: string | null;
  estagio: string | null;
  temas: string[] | null;
  created_at: string;
  updated_at: string;
};

function Page() {
  const fn = useServerFn(listarEmpresasAdmin);
  const q = useQuery({ queryKey: ["admin", "empresas"], queryFn: () => fn() });
  const [busca, setBusca] = useState("");
  const [sel, setSel] = useState<Empresa | null>(null);

  const rows = (q.data ?? []) as Empresa[];
  const filtradas = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(
      (r) =>
        r.nome_empresa.toLowerCase().includes(t) ||
        (r.cnpj ?? "").toLowerCase().includes(t) ||
        (r.setor ?? "").toLowerCase().includes(t),
    );
  }, [rows, busca]);

  if (q.isError) return <AdminErrorState error={q.error as Error} />;

  return (
    <div className="px-8 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-2">CRM · pessoas jurídicas</div>
          <h1 className="text-3xl font-medium tracking-tight">Empresas</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Empresas cadastradas no portal. {rows.length} registro{rows.length === 1 ? "" : "s"}.
          </p>
        </div>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, CNPJ, setor…"
          className="h-9 w-72 rounded-sm hairline bg-background px-3 text-sm"
        />
      </div>

      <div className="mt-8 hairline">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 hairline-b eyebrow">
          <div className="col-span-4">Empresa</div>
          <div className="col-span-2">CNPJ</div>
          <div className="col-span-2">Porte / UF</div>
          <div className="col-span-2">Setor</div>
          <div className="col-span-2 text-right">Atualizado</div>
        </div>
        {q.isLoading ? (
          <div className="p-5 text-sm text-muted-foreground">Carregando…</div>
        ) : filtradas.length === 0 ? (
          <div className="p-5 text-sm text-muted-foreground">Nenhuma empresa encontrada.</div>
        ) : (
          filtradas.map((r) => (
            <button
              key={r.id}
              onClick={() => setSel(r)}
              className="grid w-full grid-cols-12 items-center gap-4 px-5 py-3 hairline-b text-left text-sm hover:bg-secondary last:border-0"
            >
              <div className="col-span-4 font-medium">{r.nome_empresa}</div>
              <div className="col-span-2 font-mono text-xs text-muted-foreground">
                {r.cnpj ?? "—"}
              </div>
              <div className="col-span-2 font-mono text-xs text-muted-foreground">
                {r.porte ?? "—"} · {r.uf ?? "—"}
              </div>
              <div className="col-span-2 text-xs text-muted-foreground">{r.setor ?? "—"}</div>
              <div className="col-span-2 text-right font-mono text-xs text-muted-foreground">
                {new Date(r.updated_at).toLocaleDateString("pt-BR")}
              </div>
            </button>
          ))
        )}
      </div>

      {sel && (
        <div
          onClick={() => setSel(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg hairline bg-background p-6"
          >
            <div className="eyebrow mb-1">Empresa</div>
            <h2 className="text-xl font-medium tracking-tight">{sel.nome_empresa}</h2>
            <dl className="mt-6 grid grid-cols-2 gap-y-3 text-sm">
              <dt className="eyebrow">CNPJ</dt>
              <dd className="font-mono">{sel.cnpj ?? "—"}</dd>
              <dt className="eyebrow">Porte</dt>
              <dd>{sel.porte ?? "—"}</dd>
              <dt className="eyebrow">UF</dt>
              <dd>{sel.uf ?? "—"}</dd>
              <dt className="eyebrow">Setor</dt>
              <dd>{sel.setor ?? "—"}</dd>
              <dt className="eyebrow">Estágio</dt>
              <dd>{sel.estagio ?? "—"}</dd>
              <dt className="eyebrow">Temas</dt>
              <dd className="flex flex-wrap gap-1">
                {(sel.temas ?? []).length === 0
                  ? "—"
                  : (sel.temas ?? []).map((t) => (
                      <span key={t} className="hairline rounded-sm px-1.5 py-0.5 text-[11px]">
                        {t}
                      </span>
                    ))}
              </dd>
            </dl>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSel(null)}
                className="inline-flex h-9 items-center rounded-sm hairline px-3 text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
