import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getMyProfile, upsertMyProfile, type PerfilInput } from "@/lib/portal.functions";

export const Route = createFileRoute("/portal/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding · fomenta.ai" }] }),
  component: Onboarding,
});

const SETORES = [
  "Tecnologia da Informação",
  "Biotecnologia / Saúde",
  "Indústria / Manufatura",
  "Energia",
  "Agronegócio",
  "Educação",
  "Serviços",
  "Comércio",
  "Outros",
];
const PORTES = ["MEI", "ME", "EPP", "Média", "Grande", "ICT"];
const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];
const ESTAGIOS = ["Ideação", "Operação", "Tração", "Escala"];
const TEMAS = [
  "Biotecnologia","Saúde","Energia","Sustentabilidade","Indústria 4.0",
  "Inteligência Artificial","Agronegócio","Educação","Fintech","Deeptech",
  "Economia Criativa","Cidades Inteligentes","Manufatura","Química Verde",
];
const FATURAMENTO = [
  "Pré-receita",
  "Até R$ 360k/ano",
  "R$ 360k – R$ 4,8M",
  "R$ 4,8M – R$ 16M",
  "R$ 16M – R$ 90M",
  "R$ 90M – R$ 300M",
  "Acima de R$ 300M",
];

function useProfileForm() {
  return useState<PerfilInput>({
    nome_empresa: "",
    cnpj: "",
    setor: "",
    porte: "",
    uf: "",
    estagio: "",
    temas: [],
    faturamento_faixa: "",
  });
}

function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getFn = useServerFn(getMyProfile);
  const saveFn = useServerFn(upsertMyProfile);
  const { data: existing, isLoading } = useQuery({ queryKey: ["me", "profile"], queryFn: () => getFn() });
  const [step, setStep] = useState(1);
  const [form, setForm] = useProfileForm();

  useEffect(() => {
    if (existing) {
      setForm({
        nome_empresa: existing.nome_empresa,
        cnpj: existing.cnpj ?? "",
        setor: existing.setor ?? "",
        porte: existing.porte ?? "",
        uf: existing.uf ?? "",
        estagio: existing.estagio ?? "",
        temas: existing.temas ?? [],
        faturamento_faixa: existing.faturamento_faixa ?? "",
      });
    }
  }, [existing, setForm]);

  const mutation = useMutation({
    mutationFn: (payload: PerfilInput) => saveFn({ data: payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me", "profile"] });
      navigate({ to: "/portal" });
    },
  });

  const total = 5;

  function next() {
    if (step < total) setStep(step + 1);
    else mutation.mutate(form);
  }
  function prev() {
    if (step > 1) setStep(step - 1);
  }
  function toggleTema(t: string) {
    setForm((f) => ({
      ...f,
      temas: f.temas.includes(t) ? f.temas.filter((x) => x !== t) : [...f.temas, t],
    }));
  }

  const canAdvance =
    (step === 1 && form.nome_empresa.trim().length > 1) ||
    (step === 2 && form.setor && form.porte) ||
    (step === 3 && form.uf && form.estagio) ||
    (step === 4 && form.temas.length > 0) ||
    step === 5;

  if (isLoading) {
    return <div className="p-10 text-sm text-muted-foreground">Carregando…</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8">
        <div className="eyebrow mb-2">Passo {step} de {total}</div>
        <div className="h-1 w-full bg-secondary">
          <div className="h-1 bg-foreground transition-all" style={{ width: `${(step / total) * 100}%` }} />
        </div>
      </div>

      {step === 1 && (
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Sobre sua empresa</h1>
          <p className="mt-2 text-sm text-muted-foreground">Como devemos chamá-la?</p>
          <label className="mt-8 block">
            <span className="eyebrow mb-1.5 block">Nome da empresa *</span>
            <input
              value={form.nome_empresa}
              onChange={(e) => setForm({ ...form, nome_empresa: e.target.value })}
              className="h-11 w-full hairline bg-transparent px-3 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="mt-4 block">
            <span className="eyebrow mb-1.5 block">CNPJ (opcional)</span>
            <input
              value={form.cnpj ?? ""}
              onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
              className="h-11 w-full hairline bg-transparent px-3 text-sm outline-none focus:border-foreground"
              placeholder="00.000.000/0000-00"
            />
          </label>
        </div>
      )}

      {step === 2 && (
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Setor e porte</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Usamos para filtrar editais compatíveis com sua empresa.
          </p>
          <label className="mt-8 block">
            <span className="eyebrow mb-1.5 block">Setor *</span>
            <select
              value={form.setor ?? ""}
              onChange={(e) => setForm({ ...form, setor: e.target.value })}
              className="h-11 w-full hairline bg-transparent px-3 text-sm outline-none focus:border-foreground"
            >
              <option value="">Selecione…</option>
              {SETORES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <div className="mt-6">
            <div className="eyebrow mb-2">Porte *</div>
            <div className="flex flex-wrap gap-2">
              {PORTES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm({ ...form, porte: p })}
                  className={`rounded-sm px-3 py-1.5 text-sm ${
                    form.porte === p ? "bg-foreground text-background" : "hairline hover:bg-secondary"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Localização e estágio</h1>
          <label className="mt-8 block">
            <span className="eyebrow mb-1.5 block">UF *</span>
            <select
              value={form.uf ?? ""}
              onChange={(e) => setForm({ ...form, uf: e.target.value })}
              className="h-11 w-full hairline bg-transparent px-3 text-sm outline-none focus:border-foreground"
            >
              <option value="">Selecione…</option>
              {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>
          <div className="mt-6">
            <div className="eyebrow mb-2">Estágio *</div>
            <div className="flex flex-wrap gap-2">
              {ESTAGIOS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setForm({ ...form, estagio: e })}
                  className={`rounded-sm px-3 py-1.5 text-sm ${
                    form.estagio === e ? "bg-foreground text-background" : "hairline hover:bg-secondary"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Temas de interesse</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Escolha ao menos um. Usamos para calcular o match score.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {TEMAS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTema(t)}
                className={`rounded-sm px-3 py-1.5 text-sm ${
                  form.temas.includes(t) ? "bg-foreground text-background" : "hairline hover:bg-secondary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 5 && (
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Faturamento (opcional)</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ajuda a filtrar editais com exigências mínimas de receita. Não é obrigatório.
          </p>
          <div className="mt-6 grid gap-2">
            {FATURAMENTO.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setForm({ ...form, faturamento_faixa: f })}
                className={`hairline p-3 text-left text-sm ${
                  form.faturamento_faixa === f ? "border-foreground bg-secondary" : "hover:bg-secondary"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {mutation.isError && (
        <div className="mt-6 hairline border-destructive/40 p-3 text-xs text-destructive">
          {(mutation.error as Error).message}
        </div>
      )}

      <div className="mt-10 flex items-center justify-between">
        <button
          type="button"
          onClick={prev}
          disabled={step === 1}
          className="text-sm text-muted-foreground disabled:opacity-40"
        >
          ← Voltar
        </button>
        <button
          type="button"
          onClick={next}
          disabled={!canAdvance || mutation.isPending}
          className="inline-flex h-10 items-center rounded-sm bg-foreground px-6 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
        >
          {step < total ? "Avançar →" : mutation.isPending ? "Salvando…" : "Concluir"}
        </button>
      </div>
    </div>
  );
}
