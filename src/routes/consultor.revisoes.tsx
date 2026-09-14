import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { listarRevisoes } from "@/lib/consultor.functions";
import { AdminErrorState } from "@/components/AdminErrorState";

export const Route = createFileRoute("/consultor/revisoes")({
  head: () => ({
    meta: [
      { title: "Revisões feitas · Consultor · fomenta.ai" },
      {
        name: "description",
        content:
          "Acompanhe todas as candidaturas revisadas: pareceres, sugestões de proposta e o estágio atual de cada uma.",
      },
      { property: "og:title", content: "Revisões feitas · Consultor · fomenta.ai" },
      {
        property: "og:description",
        content: "Histórico de pareceres e sugestões do consultor, com o estágio de cada candidatura.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

type Revisao = {
  id: string;
  tipo: string;
  descricao: string | null;
  status: string;
  created_at: string;
  empresa: { id: string; nome_empresa: string } | null;
  candidatura: {
    id: string;
    estagio: string;
    progresso: number;
    updated_at: string;
    edital: { titulo: string; data_encerramento: string | null } | null;
    projeto: { nome: string } | null;
  } | null;
};

const ROTULO_TIPO: Record<string, string> = {
  parecer: "Parecer",
  revisao_proposta: "Sugestão de proposta",
};

const ROTULO_ESTAGIO: Record<string, string> = {
  rascunho: "Rascunho",
  aplicando: "Aplicando",
  em_revisao: "Em revisão",
  enviado: "Enviado",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

function dataCurta(v: string) {
  return new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function Page() {
  const fn = useServerFn(listarRevisoes);
  const q = useQuery({ queryKey: ["consultor", "revisoes"], queryFn: () => fn() });
  const [filtro, setFiltro] = useState<"todas" | "parecer" | "revisao_proposta">("todas");
  const [busca, setBusca] = useState("");
  const [aberta, setAberta] = useState<string | null>(null);

  const todas = (q.data ?? []) as unknown as Revisao[];

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return todas.filter((r) => {
      if (filtro !== "todas" && r.tipo !== filtro) return false;
      if (!termo) return true;
      const alvo = [
        r.empresa?.nome_empresa,
        r.candidatura?.edital?.titulo,
        r.candidatura?.projeto?.nome,
        r.descricao,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return alvo.includes(termo);
    });
  }, [todas, filtro, busca]);

  const candidaturasUnicas = new Set(
    todas.map((r) => r.candidatura?.id).filter((v): v is string => Boolean(v)),
  ).size;
  const pareceres = todas.filter((r) => r.tipo === "parecer").length;
  const sugestoes = todas.filter((r) => r.tipo === "revisao_proposta").length;

  if (q.isError) return <AdminErrorState error={q.error as Error} />;

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <div className="eyebrow mb-2">CRM</div>
      <h1 className="text-3xl font-medium tracking-tight">Revisões feitas</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Tudo que você já revisou: pareceres e sugestões de proposta, com o estágio atual de cada
        candidatura.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden hairline sm:grid-cols-3">
        {[
          ["Candidaturas revisadas", candidaturasUnicas],
          ["Pareceres", pareceres],
          ["Sugestões de proposta", sugestoes],
        ].map(([label, valor]) => (
          <div key={String(label)} className="bg-background p-5">
            <div className="eyebrow">{label}</div>
            <div className="mt-2 font-mono text-2xl">{q.isLoading ? "—" : valor}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-sm hairline p-1 font-mono text-[10px] uppercase">
          {(
            [
              ["todas", "todas"],
              ["parecer", "pareceres"],
              ["revisao_proposta", "sugestões"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFiltro(k)}
              className={`rounded-sm px-2 py-1 tracking-wider ${
                filtro === k ? "bg-foreground text-background" : "text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por empresa, edital ou texto…"
          className="h-9 w-full rounded-sm hairline bg-background px-3 text-sm sm:w-72"
        />
      </div>

      <div className="mt-4 hairline">
        {q.isLoading ? (
          <div className="p-5 text-sm text-muted-foreground">Carregando…</div>
        ) : lista.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            {todas.length === 0
              ? "Você ainda não registrou revisões. Abra um cliente e escreva um parecer ou uma sugestão de proposta."
              : "Nenhuma revisão corresponde ao filtro."}
          </div>
        ) : (
          lista.map((r) => {
            const expandida = aberta === r.id;
            const texto = r.descricao ?? "";
            return (
              <div key={r.id} className="hairline-b p-5 last:border-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-sm bg-foreground px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-background">
                        {ROTULO_TIPO[r.tipo] ?? r.tipo}
                      </span>
                      {r.candidatura && (
                        <span className="rounded-sm hairline px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                          {ROTULO_ESTAGIO[r.candidatura.estagio] ?? r.candidatura.estagio}
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {dataCurta(r.created_at)}
                      </span>
                    </div>
                    <div className="mt-2 truncate text-sm font-medium">
                      {r.candidatura?.edital?.titulo ?? "Sem candidatura vinculada"}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {[r.empresa?.nome_empresa, r.candidatura?.projeto?.nome]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {r.empresa && (
                      <Link
                        to="/consultor/clientes/$id"
                        params={{ id: r.empresa.id }}
                        className="inline-flex h-8 items-center rounded-sm hairline px-3 text-xs hover:bg-secondary"
                      >
                        Abrir cliente
                      </Link>
                    )}
                    {texto && (
                      <button
                        type="button"
                        onClick={() => setAberta(expandida ? null : r.id)}
                        aria-expanded={expandida}
                        className="inline-flex h-8 items-center rounded-sm hairline px-3 text-xs hover:bg-secondary"
                      >
                        {expandida ? "Ocultar" : "Ver sugestão"}
                      </button>
                    )}
                  </div>
                </div>

                {texto && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    {expandida ? (
                      <pre className="whitespace-pre-wrap rounded-sm bg-secondary p-4 font-sans text-sm text-foreground">
                        {texto}
                      </pre>
                    ) : (
                      <p className="line-clamp-2">{texto}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
