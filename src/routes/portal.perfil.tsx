import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getMyProfile, upsertMyProfile, type PerfilInput } from "@/lib/portal.functions";

export const Route = createFileRoute("/portal/perfil")({
  head: () => ({ meta: [{ title: "Perfil · fomenta.ai" }] }),
  component: Perfil,
});

const SETORES = [
  "Tecnologia da Informação","Biotecnologia / Saúde","Indústria / Manufatura",
  "Energia","Agronegócio","Educação","Serviços","Comércio","Outros",
];
const PORTES = ["MEI","ME","EPP","Média","Grande","ICT"];
const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const ESTAGIOS = ["Ideação","Operação","Tração","Escala"];
const TEMAS = ["Biotecnologia","Saúde","Energia","Sustentabilidade","Indústria 4.0","Inteligência Artificial","Agronegócio","Educação","Fintech","Deeptech","Economia Criativa","Cidades Inteligentes","Manufatura","Química Verde"];
const FATURAMENTO = ["Pré-receita","Até R$ 360k/ano","R$ 360k – R$ 4,8M","R$ 4,8M – R$ 16M","R$ 16M – R$ 90M","R$ 90M – R$ 300M","Acima de R$ 300M"];

function Perfil() {
  const qc = useQueryClient();
  const getFn = useServerFn(getMyProfile);
  const saveFn = useServerFn(upsertMyProfile);
  const { data, isLoading } = useQuery({ queryKey: ["me", "profile"], queryFn: () => getFn() });
  const [form, setForm] = useState<PerfilInput>({
    nome_empresa: "", cnpj: "", setor: "", porte: "", uf: "", estagio: "",
    temas: [], faturamento_faixa: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        nome_empresa: data.nome_empresa,
        cnpj: data.cnpj ?? "",
        setor: data.setor ?? "",
        porte: data.porte ?? "",
        uf: data.uf ?? "",
        estagio: data.estagio ?? "",
        temas: data.temas ?? [],
        faturamento_faixa: data.faturamento_faixa ?? "",
      });
    }
  }, [data]);

  const mut = useMutation({
    mutationFn: (p: PerfilInput) => saveFn({ data: p }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me", "profile"] });
      qc.invalidateQueries({ queryKey: ["me", "recomendados"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  function toggleTema(t: string) {
    setForm((f) => ({ ...f, temas: f.temas.includes(t) ? f.temas.filter((x) => x !== t) : [...f.temas, t] }));
  }

  if (isLoading) return <div className="p-10 text-sm text-muted-foreground">Carregando…</div>;

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <div className="eyebrow mb-2">Configurações</div>
      <h1 className="text-3xl font-medium tracking-tight">Perfil da empresa</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Estes dados alimentam o cálculo de match score.
      </p>

      <form
        onSubmit={(e) => { e.preventDefault(); mut.mutate(form); }}
        className="mt-8 space-y-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="eyebrow mb-1.5 block">Nome da empresa *</span>
            <input value={form.nome_empresa} onChange={(e) => setForm({ ...form, nome_empresa: e.target.value })} required
              className="h-11 w-full hairline bg-transparent px-3 text-sm outline-none focus:border-foreground" />
          </label>
          <label className="block">
            <span className="eyebrow mb-1.5 block">CNPJ</span>
            <input value={form.cnpj ?? ""} onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
              className="h-11 w-full hairline bg-transparent px-3 text-sm outline-none focus:border-foreground" />
          </label>
          <label className="block">
            <span className="eyebrow mb-1.5 block">Setor</span>
            <select value={form.setor ?? ""} onChange={(e) => setForm({ ...form, setor: e.target.value })}
              className="h-11 w-full hairline bg-transparent px-3 text-sm outline-none focus:border-foreground">
              <option value="">—</option>
              {SETORES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="eyebrow mb-1.5 block">UF</span>
            <select value={form.uf ?? ""} onChange={(e) => setForm({ ...form, uf: e.target.value })}
              className="h-11 w-full hairline bg-transparent px-3 text-sm outline-none focus:border-foreground">
              <option value="">—</option>
              {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>
        </div>

        <div>
          <div className="eyebrow mb-2">Porte</div>
          <div className="flex flex-wrap gap-2">
            {PORTES.map((p) => (
              <button key={p} type="button" onClick={() => setForm({ ...form, porte: p })}
                className={`rounded-sm px-3 py-1.5 text-sm ${form.porte === p ? "bg-foreground text-background" : "hairline hover:bg-secondary"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="eyebrow mb-2">Estágio</div>
          <div className="flex flex-wrap gap-2">
            {ESTAGIOS.map((e) => (
              <button key={e} type="button" onClick={() => setForm({ ...form, estagio: e })}
                className={`rounded-sm px-3 py-1.5 text-sm ${form.estagio === e ? "bg-foreground text-background" : "hairline hover:bg-secondary"}`}>
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="eyebrow mb-2">Temas de interesse</div>
          <div className="flex flex-wrap gap-2">
            {TEMAS.map((t) => (
              <button key={t} type="button" onClick={() => toggleTema(t)}
                className={`rounded-sm px-3 py-1.5 text-sm ${form.temas.includes(t) ? "bg-foreground text-background" : "hairline hover:bg-secondary"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="eyebrow mb-2">Faixa de faturamento</div>
          <div className="grid gap-2 md:grid-cols-2">
            {FATURAMENTO.map((f) => (
              <button key={f} type="button" onClick={() => setForm({ ...form, faturamento_faixa: f })}
                className={`hairline p-3 text-left text-sm ${form.faturamento_faixa === f ? "border-foreground bg-secondary" : "hover:bg-secondary"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {mut.isError && (
          <div className="hairline border-destructive/40 p-3 text-xs text-destructive">
            {(mut.error as Error).message}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={mut.isPending}
            className="inline-flex h-11 items-center rounded-sm bg-foreground px-6 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50">
            {mut.isPending ? "Salvando…" : "Salvar alterações"}
          </button>
          {saved && <span className="text-xs text-muted-foreground">salvo ✓</span>}
        </div>
      </form>
    </div>
  );
}
