import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getEdital } from "@/lib/scrape.functions";
import { computeMatch } from "@/lib/portal.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/portal/editais/$id")({
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
  const fn = useServerFn(getEdital);
  const matchFn = useServerFn(computeMatch);
  const { data, isLoading } = useQuery({
    queryKey: ["edital", id],
    queryFn: () => fn({ data: { id } }),
  });

  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const matchQ = useQuery({
    queryKey: ["match", id, session?.user?.id ?? ""],
    queryFn: () => matchFn({ data: { editalId: id } }),
    enabled: !!session,
  });

  if (isLoading) return <div className="p-10 text-sm text-muted-foreground">Carregando…</div>;
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
                {data.historico.map((h) => (
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
            <div className="eyebrow mb-2">Coleta</div>
            <div className="font-mono">
              Coletado em {new Date(e.coletado_em).toLocaleString("pt-BR")}
            </div>
            <div className="mt-1 font-mono">Fonte: {e.fonte}</div>
            <div className="mt-1 font-mono">Publicação: {fmt(e.data_publicacao)}</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
