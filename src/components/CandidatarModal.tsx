import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { listMyProjetos, createProjeto } from "@/lib/portal.functions";
import { criarCandidatura, criarTarefa } from "@/lib/candidatura.functions";
import { extrairRequisitos } from "@/lib/ai.functions";

export function CandidatarModal({ editalId, onClose }: { editalId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const listFn = useServerFn(listMyProjetos);
  const criarFn = useServerFn(createProjeto);
  const candFn = useServerFn(criarCandidatura);
  const requisitosFn = useServerFn(extrairRequisitos);
  const criarTarefaFn = useServerFn(criarTarefa);
  const [modo, setModo] = useState<"lista" | "novo">("lista");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [importarChecklist, setImportarChecklist] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [statusImport, setStatusImport] = useState<string | null>(null);

  const projetosQ = useQuery({ queryKey: ["me", "projetos"], queryFn: () => listFn() });

  const criarProjetoMut = useMutation({
    mutationFn: async () => criarFn({ data: { nome, descricao: descricao || null } }),
    onSuccess: (novo) => {
      qc.invalidateQueries({ queryKey: ["me", "projetos"] });
      setSelecionado((novo as { id: string }).id);
      setModo("lista");
      setErro(null);
    },
    onError: (e) => setErro((e as Error).message),
  });

  const candMut = useMutation({
    mutationFn: async () => {
      if (!selecionado) throw new Error("selecione um projeto");
      const r = await candFn({ data: { editalId, projetoId: selecionado } });
      const candidaturaId = (r as { id: string }).id;

      if (importarChecklist) {
        setStatusImport("Extraindo requisitos com IA…");
        try {
          const req = await requisitosFn({ data: { editalId } });
          const itens = (req as { itens: string[] }).itens ?? [];
          if (itens.length > 0) {
            setStatusImport(`Criando ${itens.length} tarefas…`);
            for (const t of itens) {
              await criarTarefaFn({ data: { candidaturaId, titulo: t } });
            }
          }
        } catch {
          // Falha na IA não deve bloquear a criação da candidatura.
          setStatusImport("IA indisponível — candidatura criada sem checklist.");
        }
      }
      return { id: candidaturaId };
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["me", "candidaturas"] });
      navigate({ to: "/portal/candidaturas/$id", params: { id: r.id } });
    },
    onError: (e) => setErro((e as Error).message),
  });

  const projetos = projetosQ.data ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg hairline bg-background p-6"
      >
        <div className="eyebrow mb-2">Candidatar-se</div>
        <h2 className="text-xl font-medium tracking-tight">Escolha um projeto</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Uma candidatura vincula um projeto seu a este edital e passa a ser acompanhada no kanban.
        </p>

        {modo === "lista" ? (
          <>
            {projetos.length === 0 ? (
              <div className="mt-6 hairline p-4 text-sm text-muted-foreground">
                Você ainda não tem projetos cadastrados.
              </div>
            ) : (
              <div className="mt-6 space-y-2 max-h-72 overflow-auto">
                {projetos.map((p) => (
                  <label
                    key={p.id}
                    className={`flex cursor-pointer items-start gap-3 hairline p-3 hover:bg-secondary ${
                      selecionado === p.id ? "border-foreground" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      className="mt-1"
                      checked={selecionado === p.id}
                      onChange={() => setSelecionado(p.id)}
                    />
                    <div>
                      <div className="text-sm font-medium">{p.nome}</div>
                      {p.descricao && (
                        <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {p.descricao}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
            <button
              type="button"
              className="mt-4 text-xs text-muted-foreground hover:text-foreground underline"
              onClick={() => setModo("novo")}
            >
              + criar um novo projeto
            </button>
          </>
        ) : (
          <div className="mt-6 space-y-3">
            <div>
              <label className="eyebrow mb-1 block">Nome do projeto</label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="h-9 w-full rounded-sm hairline bg-background px-3 text-sm"
                placeholder="Ex.: Plataforma de IA para agro"
              />
            </div>
            <div>
              <label className="eyebrow mb-1 block">Descrição</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                className="w-full rounded-sm hairline bg-background p-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setModo("lista")}
                className="inline-flex h-9 items-center rounded-sm hairline px-3 text-sm"
              >
                Cancelar
              </button>
              <button
                disabled={!nome.trim() || criarProjetoMut.isPending}
                onClick={() => criarProjetoMut.mutate()}
                className="inline-flex h-9 items-center rounded-sm bg-foreground px-3 text-sm font-medium text-background disabled:opacity-40"
              >
                {criarProjetoMut.isPending ? "Criando…" : "Criar e usar"}
              </button>
            </div>
          </div>
        )}

        <label className="mt-5 flex cursor-pointer items-start gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={importarChecklist}
            onChange={(e) => setImportarChecklist(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Importar requisitos do edital como checklist inicial{" "}
            <span className="font-mono">(IA)</span>.
          </span>
        </label>

        {statusImport && (
          <div className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {statusImport}
          </div>
        )}
        {erro && <div className="mt-4 text-xs text-destructive">{erro}</div>}

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-[var(--hairline)] pt-4">
          <button
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-sm hairline px-3 text-sm"
          >
            Fechar
          </button>
          <button
            disabled={!selecionado || candMut.isPending || modo === "novo"}
            onClick={() => candMut.mutate()}
            className="inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-sm font-medium text-background disabled:opacity-40"
          >
            {candMut.isPending ? "Vinculando…" : "Confirmar candidatura"}
          </button>
        </div>
      </div>
    </div>
  );
}
