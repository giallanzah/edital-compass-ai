import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  listMyProjetos,
  createProjeto,
  updateProjeto,
  deleteProjeto,
} from "@/lib/portal.functions";

export const Route = createFileRoute("/portal/projetos")({
  component: Projetos,
});

function Projetos() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMyProjetos);
  const createFn = useServerFn(createProjeto);
  const updateFn = useServerFn(updateProjeto);
  const deleteFn = useServerFn(deleteProjeto);

  const { data: projetos = [], isLoading } = useQuery({
    queryKey: ["me", "projetos"],
    queryFn: () => listFn(),
  });

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");

  function resetForm() {
    setShowForm(false);
    setEditing(null);
    setNome("");
    setDescricao("");
  }

  const createMut = useMutation({
    mutationFn: (p: { nome: string; descricao: string }) =>
      createFn({ data: { nome: p.nome, descricao: p.descricao || null } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me", "projetos"] });
      resetForm();
    },
  });
  const updateMut = useMutation({
    mutationFn: (p: { id: string; nome: string; descricao: string }) =>
      updateFn({ data: { id: p.id, nome: p.nome, descricao: p.descricao || null } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me", "projetos"] });
      resetForm();
    },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me", "projetos"] }),
  });

  function startEdit(p: { id: string; nome: string; descricao: string | null }) {
    setEditing(p.id);
    setNome(p.nome);
    setDescricao(p.descricao ?? "");
    setShowForm(true);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    if (editing) updateMut.mutate({ id: editing, nome, descricao });
    else createMut.mutate({ nome, descricao });
  }

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-2">Pipeline</div>
          <h1 className="text-3xl font-medium tracking-tight">Meus projetos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre projetos para depois vinculá-los a editais.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-sm font-medium text-background"
          >
            + Novo projeto
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="mt-8 hairline p-5">
          <div className="eyebrow mb-3">{editing ? "Editar projeto" : "Novo projeto"}</div>
          <label className="block">
            <span className="eyebrow mb-1.5 block">Nome *</span>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="h-10 w-full hairline bg-transparent px-3 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="mt-4 block">
            <span className="eyebrow mb-1.5 block">Descrição</span>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className="w-full hairline bg-transparent p-3 text-sm outline-none focus:border-foreground"
            />
          </label>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={createMut.isPending || updateMut.isPending}
              className="inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
            >
              {editing ? "Salvar" : "Criar"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex h-9 items-center rounded-sm hairline px-4 text-sm hover:bg-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="mt-8">
        {isLoading ? (
          <div className="hairline p-6 text-sm text-muted-foreground">Carregando…</div>
        ) : projetos.length === 0 ? (
          <div className="hairline p-12 text-center">
            <div className="text-sm">Nenhum projeto ainda.</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Comece cadastrando o primeiro projeto da sua empresa.
            </p>
          </div>
        ) : (
          <div className="hairline divide-y divide-[var(--hairline)]">
            {projetos.map((p) => (
              <div key={p.id} className="flex items-start justify-between gap-4 px-5 py-4">
                <div>
                  <div className="text-sm font-medium">{p.nome}</div>
                  {p.descricao && (
                    <div className="mt-1 text-xs text-muted-foreground">{p.descricao}</div>
                  )}
                  <div className="mt-2 font-mono text-[10px] text-muted-foreground">
                    criado em {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(p)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    editar
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Excluir "${p.nome}"?`)) deleteMut.mutate(p.id);
                    }}
                    className="text-xs text-destructive/70 hover:text-destructive"
                  >
                    excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
