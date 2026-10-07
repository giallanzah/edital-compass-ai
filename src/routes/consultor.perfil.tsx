import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { meuPerfilConsultor, salvarPerfilConsultor } from "@/lib/consultor.functions";

export const Route = createFileRoute("/consultor/perfil")({
  head: () => ({ meta: [{ title: "Meu perfil · Consultor · fomenta.ai" }] }),
  component: PerfilConsultor,
});

const input = "h-9 w-full rounded-sm hairline bg-background px-3 text-sm";

function PerfilConsultor() {
  const qc = useQueryClient();
  const getFn = useServerFn(meuPerfilConsultor);
  const saveFn = useServerFn(salvarPerfilConsultor);
  const q = useQuery({ queryKey: ["consultor", "perfil"], queryFn: () => getFn() });
  const [f, setF] = useState({ nome: "", telefone: "", especialidade: "", bio: "", links: "" });

  useEffect(() => {
    if (q.data)
      setF({
        nome: q.data.nome ?? "",
        telefone: q.data.telefone ?? "",
        especialidade: q.data.especialidade ?? "",
        bio: q.data.bio ?? "",
        links: (q.data.links ?? []).join("\n"),
      });
  }, [q.data]);

  const mut = useMutation({
    mutationFn: () => saveFn({ data: { ...f, links: f.links.split("\n") } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["consultor"] });
    },
  });

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => {
    mut.reset();
    setF((p) => ({ ...p, [k]: e.target.value }));
  };

  return (
    <div className="max-w-2xl px-8 py-10">
      <div className="eyebrow mb-2">Consultor · perfil</div>
      <h1 className="text-3xl font-medium tracking-tight">Meu perfil</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Esses dados ajudam a equipe Fomenta.ai a indicar você para os clientes certos.
      </p>
      {q.isLoading ? (
        <div className="mt-8 text-sm text-muted-foreground">Carregando…</div>
      ) : (
        <form
          className="mt-8 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate();
          }}
        >
          <label className="block">
            <span className="eyebrow">Nome *</span>
            <input className={`${input} mt-1.5`} value={f.nome} onChange={set("nome")} required maxLength={120} />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="eyebrow">E-mail</span>
              <input className={`${input} mt-1.5 text-muted-foreground`} value={q.data?.email ?? ""} disabled />
            </label>
            <label className="block">
              <span className="eyebrow">Telefone</span>
              <input className={`${input} mt-1.5`} value={f.telefone} onChange={set("telefone")} placeholder="(11) 99999-9999" maxLength={40} />
            </label>
          </div>
          <label className="block">
            <span className="eyebrow">Especialidades / áreas de atuação</span>
            <input className={`${input} mt-1.5`} value={f.especialidade} onChange={set("especialidade")} placeholder="Ex.: FINEP, Lei do Bem, agritech" maxLength={500} />
          </label>
          <label className="block">
            <span className="eyebrow">Minibiografia</span>
            <textarea className="mt-1.5 min-h-28 w-full rounded-sm hairline bg-background p-3 text-sm" value={f.bio} onChange={set("bio")} maxLength={2000} />
            <span className="mt-1 block text-right font-mono text-[10px] text-muted-foreground">{f.bio.length}/2000</span>
          </label>
          <label className="block">
            <span className="eyebrow">Links (um por linha, até 5)</span>
            <textarea className="mt-1.5 min-h-20 w-full rounded-sm hairline bg-background p-3 font-mono text-xs" value={f.links} onChange={set("links")} placeholder="https://linkedin.com/in/..." />
          </label>
          <div className="flex items-center gap-3">
            <button disabled={mut.isPending} className="inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-sm font-medium text-background disabled:opacity-50">
              {mut.isPending ? "Salvando…" : "Salvar perfil"}
            </button>
            {mut.isSuccess && <span className="text-sm text-muted-foreground">Perfil atualizado.</span>}
            {mut.isError && <span className="text-sm text-destructive">{(mut.error as Error).message}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
