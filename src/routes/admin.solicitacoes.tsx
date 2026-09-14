import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { listarSolicitacoesAdmin, decidirSolicitacaoAdmin } from "@/lib/admin.functions";
import { AdminErrorState } from "@/components/AdminErrorState";

export const Route = createFileRoute("/admin/solicitacoes")({
  head: () => ({ meta: [{ title: "Solicitações de acesso · fomenta.ai" }] }),
  component: Page,
});

const FILTROS = [
  { key: "pendente", label: "Pendentes" },
  { key: "aprovada", label: "Aprovadas" },
  { key: "recusada", label: "Recusadas" },
  { key: "todas", label: "Todas" },
] as const;

type FiltroKey = (typeof FILTROS)[number]["key"];

function rotuloPerfil(p: string) {
  return p === "consultor" ? "Consultor Especialista" : "Equipe Fomenta";
}

function Page() {
  const qc = useQueryClient();
  const listarFn = useServerFn(listarSolicitacoesAdmin);
  const decidirFn = useServerFn(decidirSolicitacaoAdmin);

  const [filtro, setFiltro] = useState<FiltroKey>("pendente");
  const [obs, setObs] = useState<Record<string, string>>({});

  const solicitacoesQ = useQuery({
    queryKey: ["admin", "solicitacoes"],
    queryFn: () => listarFn(),
  });

  const decidirMut = useMutation({
    mutationFn: async (v: { id: string; decisao: "aprovada" | "recusada" }) =>
      decidirFn({ data: { ...v, observacao: obs[v.id]?.trim() || null } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "solicitacoes"] });
      qc.invalidateQueries({ queryKey: ["admin", "consultores"] });
      qc.invalidateQueries({ queryKey: ["admin", "usuarios"] });
    },
  });

  const todas = solicitacoesQ.data ?? [];
  const lista = useMemo(
    () => (filtro === "todas" ? todas : todas.filter((s) => s.status === filtro)),
    [todas, filtro],
  );
  const pendentes = todas.filter((s) => s.status === "pendente").length;

  if (solicitacoesQ.isError) return <AdminErrorState error={solicitacoesQ.error as Error} />;

  return (
    <div className="px-8 py-10">
      <div className="eyebrow mb-2">Controle de acesso</div>
      <h1 className="text-3xl font-medium tracking-tight">Solicitações de acesso</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Aprove ou recuse os pedidos de Consultor Especialista e Equipe Fomenta. Ao aprovar, o
        usuário recebe imediatamente o perfil correspondente.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`inline-flex h-8 items-center rounded-sm px-3 font-mono text-[10px] uppercase tracking-wider ${
              filtro === f.key
                ? "bg-foreground text-background"
                : "hairline text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
            {f.key === "pendente" && pendentes > 0 ? ` · ${pendentes}` : ""}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {solicitacoesQ.isLoading ? (
          <div className="hairline p-5 text-sm text-muted-foreground">Carregando…</div>
        ) : lista.length === 0 ? (
          <div className="hairline p-5 text-sm text-muted-foreground">
            Nenhuma solicitação nesta visão.
          </div>
        ) : (
          lista.map((s) => {
            const pendente = s.status === "pendente";
            const emAndamento = decidirMut.isPending && decidirMut.variables?.id === s.id;
            return (
              <article key={s.id} className="hairline p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{s.nome || "—"}</div>
                    <div className="font-mono text-xs text-muted-foreground">{s.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hairline rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {rotuloPerfil(s.perfil)}
                    </span>
                    <span
                      className={`rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase ${
                        pendente
                          ? "bg-foreground text-background"
                          : "hairline text-muted-foreground"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                </div>

                <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  solicitado em {new Date(s.created_at).toLocaleDateString("pt-BR")}
                  {s.decidido_em
                    ? ` · decidido em ${new Date(s.decidido_em).toLocaleDateString("pt-BR")}`
                    : ""}
                </div>

                {!pendente && s.observacao && (
                  <p className="mt-3 text-sm text-muted-foreground">{s.observacao}</p>
                )}

                {pendente && (
                  <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                    <input
                      value={obs[s.id] ?? ""}
                      onChange={(e) => setObs((o) => ({ ...o, [s.id]: e.target.value }))}
                      placeholder="Observação (opcional)"
                      className="h-9 flex-1 rounded-sm hairline bg-background px-3 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => decidirMut.mutate({ id: s.id, decisao: "aprovada" })}
                        disabled={emAndamento}
                        className="inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-sm font-medium text-background disabled:opacity-40"
                      >
                        {emAndamento ? "Processando…" : "Aprovar"}
                      </button>
                      <button
                        onClick={() => decidirMut.mutate({ id: s.id, decisao: "recusada" })}
                        disabled={emAndamento}
                        className="inline-flex h-9 items-center rounded-sm hairline px-4 text-sm hover:text-destructive disabled:opacity-40"
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {decidirMut.error && (
        <div className="mt-3 text-[11px] text-destructive">
          {(decidirMut.error as Error).message}
        </div>
      )}
    </div>
  );
}
