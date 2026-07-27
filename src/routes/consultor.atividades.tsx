import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  listarAtividades,
  concluirAtividade,
  listarClientesDoConsultor,
  criarAtividade,
} from "@/lib/consultor.functions";
import { AdminErrorState } from "@/components/AdminErrorState";

export const Route = createFileRoute("/consultor/atividades")({ component: Page });

const TIPOS = [
  ["chamado_cliente", "Chamado do cliente"],
  ["follow_up", "Follow-up"],
  ["revisao_documento", "Revisão de documento"],
] as const;

function Page() {
  const qc = useQueryClient();
  const fn = useServerFn(listarAtividades);
  const concluirFn = useServerFn(concluirAtividade);
  const clientesFn = useServerFn(listarClientesDoConsultor);
  const criarFn = useServerFn(criarAtividade);

  const q = useQuery({ queryKey: ["consultor", "atividades"], queryFn: () => fn() });
  const clientesQ = useQuery({ queryKey: ["consultor", "clientes"], queryFn: () => clientesFn() });

  const [filtro, setFiltro] = useState<"pendentes" | "todas">("pendentes");
  const [novaEmpresa, setNovaEmpresa] = useState("");
  const [novoTipo, setNovoTipo] = useState<string>(TIPOS[1][0]);
  const [novaDescricao, setNovaDescricao] = useState("");

  const concluirMut = useMutation({
    mutationFn: async (id: string) => concluirFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["consultor", "atividades"] }),
  });

  const criarMut = useMutation({
    mutationFn: async () =>
      criarFn({
        data: { empresaId: novaEmpresa, tipo: novoTipo, descricao: novaDescricao || null },
      }),
    onSuccess: () => {
      setNovaDescricao("");
      qc.invalidateQueries({ queryKey: ["consultor", "atividades"] });
    },
  });

  if (q.isError) return <AdminErrorState error={q.error as Error} />;

  const atividades = (q.data ?? []).filter((a) =>
    filtro === "pendentes" ? a.status !== "concluida" : true,
  );
  const clientes = clientesQ.data ?? [];

  return (
    <div className="px-8 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-2">CRM</div>
          <h1 className="text-3xl font-medium tracking-tight">Atividades</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Chamados de clientes e tarefas de acompanhamento da sua carteira.
          </p>
        </div>
        <div className="flex gap-1 rounded-sm hairline p-1 font-mono text-[10px] uppercase">
          {(["pendentes", "todas"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFiltro(k)}
              className={`rounded-sm px-2 py-1 tracking-wider ${
                filtro === k ? "bg-foreground text-background" : "text-muted-foreground"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 hairline p-4">
        <div className="eyebrow mb-3">Nova atividade</div>
        <div className="flex flex-wrap items-end gap-2">
          <select
            value={novaEmpresa}
            onChange={(e) => setNovaEmpresa(e.target.value)}
            className="h-9 rounded-sm hairline bg-background px-2 text-sm"
          >
            <option value="">Cliente…</option>
            {clientes.map((c) => (
              <option key={c.empresaId} value={c.empresaId}>
                {c.nomeEmpresa}
              </option>
            ))}
          </select>
          <select
            value={novoTipo}
            onChange={(e) => setNovoTipo(e.target.value)}
            className="h-9 rounded-sm hairline bg-background px-2 text-sm"
          >
            {TIPOS.map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
          <input
            value={novaDescricao}
            onChange={(e) => setNovaDescricao(e.target.value)}
            placeholder="Descrição…"
            className="h-9 min-w-[220px] flex-1 rounded-sm hairline bg-background px-2 text-sm"
          />
          <button
            onClick={() => criarMut.mutate()}
            disabled={!novaEmpresa || criarMut.isPending}
            className="inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-sm font-medium text-background disabled:opacity-40"
          >
            {criarMut.isPending ? "Criando…" : "Adicionar"}
          </button>
        </div>
      </div>

      <div className="mt-6 hairline">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 hairline-b eyebrow">
          <div className="col-span-2">Cliente</div>
          <div className="col-span-2">Tipo</div>
          <div className="col-span-4">Descrição</div>
          <div className="col-span-2">Vencimento</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>
        {q.isLoading ? (
          <div className="p-5 text-sm text-muted-foreground">Carregando…</div>
        ) : atividades.length === 0 ? (
          <div className="p-5 text-sm text-muted-foreground">Nenhuma atividade.</div>
        ) : (
          atividades.map((a) => (
            <div
              key={a.id}
              className="grid grid-cols-12 items-center gap-4 px-5 py-3 hairline-b text-sm last:border-0"
            >
              <div className="col-span-2 font-medium">
                {(a.empresa as { nome_empresa: string } | null)?.nome_empresa ?? "—"}
              </div>
              <div className="col-span-2">
                <span className="rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-[10px] uppercase">
                  {a.tipo}
                </span>
              </div>
              <div className="col-span-4 text-xs text-muted-foreground line-clamp-2">
                {a.descricao ?? "—"}
              </div>
              <div className="col-span-2 font-mono text-[11px] text-muted-foreground">
                {a.data_vencimento ? new Date(a.data_vencimento).toLocaleDateString("pt-BR") : "—"}
              </div>
              <div className="col-span-2 flex justify-end">
                {a.status === "concluida" ? (
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    concluída
                  </span>
                ) : (
                  <button
                    onClick={() => concluirMut.mutate(a.id)}
                    disabled={concluirMut.isPending}
                    className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-40"
                  >
                    concluir
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
