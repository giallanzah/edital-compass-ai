import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getEdital } from "@/lib/scrape.functions";
import { computeMatch } from "@/lib/portal.functions";
import { resumirEdital, extrairRequisitos } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { CandidatarModal } from "@/components/CandidatarModal";

export const Route = createFileRoute("/portal/editais/$id")({
  // Loader server-side: o HTML inicial já vem com o conteúdo do edital (SSR/SEO).
  loader: async ({ params }) => {
    return await getEdital({ data: { id: params.id } });
  },
  head: ({ loaderData }) => {
    const e = loaderData?.edital as
      | {
          id: string;
          slug: string | null;
          titulo: string;
          descricao_curta: string | null;
          descricao_completa: string | null;
          fonte: string;
          resumo_ia: { objetivo?: string } | null;
          url_original?: string | null;
        }
      | undefined;
    if (!e) {
      return { meta: [{ title: "Edital não encontrado · fomenta.ai" }] };
    }
    const title = `${e.titulo} — prazo, valores e elegibilidade | fomenta.ai`;
    const rawDesc =
      e.resumo_ia?.objetivo ??
      e.descricao_curta ??
      (e.descricao_completa ?? "").slice(0, 160) ??
      `${e.titulo} (${e.fonte}): datas, valores, elegibilidade e link para a fonte oficial.`;
    const description = rawDesc.length > 160 ? rawDesc.slice(0, 157) + "…" : rawDesc;
    const ogKey = e.slug ?? e.id;
    // og:image relativa — resolvida pelo cliente/crawler contra a origem servida.
    const ogImage = `/api/og/edital/${ogKey}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:image", content: ogImage },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: ogImage },
      ],
    };
  },
  component: EditalDetail,
});

const STATUS_LABEL: Record<string, string> = {
  aberto: "Aberto",
  abre_em_breve: "Abre em breve",
  encerrando_em_breve: "Encerrando em breve",
  encerrado: "Encerrado",
  sem_prazo: "Sem prazo",
};

function EditalDetail() {
  const { id } = Route.useParams();
  const data = Route.useLoaderData();
  const matchFn = useServerFn(computeMatch);
  const resumoFn = useServerFn(resumirEdital);
  const requisitosFn = useServerFn(extrairRequisitos);

  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const [modalOpen, setModalOpen] = useState(false);

  const editalId = (data?.edital as { id: string } | undefined)?.id;

  const matchQ = useQuery({
    queryKey: ["match", id, session?.user?.id ?? ""],
    queryFn: () => matchFn({ data: { editalId: editalId! } }),
    enabled: !!session && !!editalId,
  });

  const resumoMut = useMutation({
    mutationFn: async () => resumoFn({ data: { editalId: editalId! } }),
  });
  const requisitosMut = useMutation({
    mutationFn: async () => requisitosFn({ data: { editalId: editalId! } }),
  });


  if (!data) {
    return (
      <div className="p-10 text-sm text-muted-foreground">
        Edital não encontrado.{" "}
        <Link to="/portal/editais" className="underline">
          Voltar ao catálogo
        </Link>
      </div>
    );
  }

  const e = data.edital as {
    titulo: string;
    fonte: string;
    tipo_apoio: string | null;
    status: string;
    descricao_curta: string | null;
    descricao_completa: string | null;
    data_publicacao: string | null;
    data_abertura: string | null;
    data_encerramento: string | null;
    abrangencia: string | null;
    publico_alvo: string[] | null;
    tema: string[] | null;
    url_original: string;
    confianca_extracao: number;
    coletado_em: string;
  };

  const dias = e.data_encerramento
    ? Math.ceil((new Date(e.data_encerramento).getTime() - Date.now()) / 86_400_000)
    : null;

  const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("pt-BR") : "—");

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <Link to="/portal/editais" className="eyebrow hover:text-foreground">
        ← Catálogo
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="hairline rounded-sm px-2 py-0.5 font-mono text-[11px]">{e.fonte}</span>
        {e.tipo_apoio && (
          <span className="hairline rounded-sm px-2 py-0.5 font-mono text-[11px]">
            {e.tipo_apoio}
          </span>
        )}
        <span className="hairline rounded-sm px-2 py-0.5 font-mono text-[11px]">
          {STATUS_LABEL[e.status] ?? e.status}
        </span>
      </div>

      <h1 className="mt-4 text-3xl font-medium tracking-tight md:text-4xl">{e.titulo}</h1>
      {e.descricao_curta && (
        <p className="mt-4 max-w-3xl text-base text-muted-foreground">{e.descricao_curta}</p>
      )}

      <div className="mt-8 grid grid-cols-2 hairline md:grid-cols-4">
        {[
          {
            k: "Prazo",
            v: dias === null ? "sem prazo" : dias > 0 ? `${dias} dias` : "encerrado",
          },
          { k: "Abertura", v: fmt(e.data_abertura) },
          { k: "Encerramento", v: fmt(e.data_encerramento) },
          {
            k: "Confiança",
            v: `${Math.round(e.confianca_extracao * 100)}%`,
          },
        ].map((s, i) => (
          <div key={s.k} className={`p-5 ${i !== 0 ? "border-l border-[var(--hairline)]" : ""}`}>
            <div className="font-mono text-lg">{s.v}</div>
            <div className="eyebrow mt-1">{s.k}</div>
          </div>
        ))}
      </div>

      {session && (
        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <div className="eyebrow">Análise com IA</div>
            <div className="flex gap-2">
              <button
                onClick={() => resumoMut.mutate()}
                disabled={resumoMut.isPending}
                className="inline-flex h-8 items-center rounded-sm hairline px-3 text-xs hover:bg-secondary disabled:opacity-40"
              >
                {resumoMut.isPending ? "Resumindo…" : "Resumir com IA"}
              </button>
              <button
                onClick={() => requisitosMut.mutate()}
                disabled={requisitosMut.isPending}
                className="inline-flex h-8 items-center rounded-sm hairline px-3 text-xs hover:bg-secondary disabled:opacity-40"
              >
                {requisitosMut.isPending ? "Extraindo…" : "Extrair requisitos"}
              </button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="hairline p-4">
              <div className="eyebrow mb-2">Resumo executivo</div>
              {resumoMut.data ? (
                <dl className="space-y-2 text-xs">
                  <div>
                    <dt className="eyebrow">Objetivo</dt>
                    <dd>{(resumoMut.data as { objetivo: string }).objetivo}</dd>
                  </div>
                  <div>
                    <dt className="eyebrow">Quem pode</dt>
                    <dd>{(resumoMut.data as { publico: string }).publico}</dd>
                  </div>
                  <div>
                    <dt className="eyebrow">Valor / prazo</dt>
                    <dd>{(resumoMut.data as { valor_prazo: string }).valor_prazo}</dd>
                  </div>
                </dl>
              ) : resumoMut.error ? (
                <div className="text-[11px] text-destructive">
                  {(resumoMut.error as Error).message}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Clique em "Resumir com IA" para gerar 3 bullets — objetivo, público-alvo e valor/prazo.
                </p>
              )}
            </div>
            <div className="hairline p-4">
              <div className="eyebrow mb-2">Checklist de requisitos</div>
              {requisitosMut.data ? (
                <ul className="space-y-1.5 text-xs">
                  {((requisitosMut.data as { itens: string[] }).itens ?? []).map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-0.5">□</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              ) : requisitosMut.error ? (
                <div className="text-[11px] text-destructive">
                  {(requisitosMut.error as Error).message}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Extraia automaticamente a lista de requisitos objetivos do edital.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-10">

          {e.descricao_completa && (
            <section>
              <div className="eyebrow mb-3">Descrição</div>
              <p className="whitespace-pre-wrap text-sm">{e.descricao_completa}</p>
            </section>
          )}
          {(e.publico_alvo?.length ?? 0) > 0 && (
            <section>
              <div className="eyebrow mb-3">Público-alvo</div>
              <div className="flex flex-wrap gap-2">
                {e.publico_alvo!.map((p) => (
                  <span key={p} className="hairline rounded-sm px-2.5 py-1 text-xs">
                    {p}
                  </span>
                ))}
              </div>
            </section>
          )}
          {(e.tema?.length ?? 0) > 0 && (
            <section>
              <div className="eyebrow mb-3">Temas</div>
              <div className="flex flex-wrap gap-2">
                {e.tema!.map((t) => (
                  <span key={t} className="hairline rounded-sm px-2.5 py-1 text-xs">
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}
          <section>
            <div className="eyebrow mb-3">Versões coletadas</div>
            {data.historico.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma versão anterior registrada.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {(data.historico as Array<{ id: string; hash_conteudo: string; criado_em: string }>).map((h) => (
                  <li key={h.id} className="flex justify-between hairline-b pb-2">
                    <span className="font-mono text-xs">{h.hash_conteudo.slice(0, 12)}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {new Date(h.criado_em).toLocaleString("pt-BR")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-3">
          <a
            href={e.url_original}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 w-full items-center justify-center rounded-sm bg-foreground text-sm font-medium text-background hover:opacity-90"
          >
            Ver edital na fonte ↗
          </a>

          {session ? (
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex h-11 w-full items-center justify-center rounded-sm hairline text-sm font-medium hover:bg-secondary"
            >
              Candidatar-se com um projeto
            </button>
          ) : null}

          {/* Match score */}
          {session === null ? (
            <div className="hairline p-4">
              <div className="eyebrow mb-2">Match score</div>
              <p className="text-xs text-muted-foreground">
                Entre para calcular a compatibilidade deste edital com sua empresa.
              </p>
              <Link
                to="/portal/login"
                className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-sm hairline text-xs font-medium hover:bg-secondary"
              >
                Entrar
              </Link>
            </div>
          ) : session === undefined || matchQ.isLoading ? (
            <div className="hairline p-4 text-xs text-muted-foreground">Calculando…</div>
          ) : matchQ.data && "needsProfile" in matchQ.data ? (
            <div className="hairline p-4">
              <div className="eyebrow mb-2">Match score</div>
              <p className="text-xs text-muted-foreground">
                Complete seu perfil para ver seu match com este edital.
              </p>
              <Link
                to="/portal/onboarding"
                className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-sm bg-foreground text-xs font-medium text-background"
              >
                Completar perfil
              </Link>
            </div>
          ) : matchQ.data ? (
            <div className="hairline p-4">
              <div className="flex items-baseline justify-between">
                <div className="eyebrow">Match score</div>
                <div className="font-mono text-3xl">{matchQ.data.score}</div>
              </div>
              <ul className="mt-4 space-y-2 text-xs">
                {matchQ.data.detalhes.map((d) => (
                  <li key={d.rotulo} className="flex items-start gap-2">
                    <span className={d.ok ? "text-foreground" : "text-destructive/70"}>
                      {d.ok ? "✓" : "✗"}
                    </span>
                    <span>
                      <span className="font-medium">{d.rotulo}</span>
                      {d.nota && <span className="text-muted-foreground"> · {d.nota}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="hairline mt-6 p-4 text-xs text-muted-foreground">
            <div className="eyebrow mb-2">Fonte oficial</div>
            <a href={e.url_original} target="_blank" rel="noreferrer" className="break-all underline">
              {e.url_original}
            </a>
            <div className="mt-2 font-mono">
              Verificado em {new Date(e.coletado_em).toLocaleString("pt-BR")}
            </div>
            <div className="mt-1 font-mono">Fonte: {e.fonte}</div>
            <div className="mt-1 font-mono">Publicação: {fmt(e.data_publicacao)}</div>
          </div>
        </aside>
      </div>

      {modalOpen && (
        <CandidatarModal
          editalId={(data.edital as { id: string }).id}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
