import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { agencies } from "@/data/editais";
import { publicStats, editaisDestaque } from "@/lib/portal.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "fomenta.ai — Editais e fomento para inovação brasileira" },
      {
        name: "description",
        content:
          "Descubra, organize e acompanhe editais e linhas de fomento de CNPq, FINEP, SEBRAE e BNDES em uma única plataforma.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    n: "01",
    t: "Busca semântica",
    d: "Algoritmo de matching que entende o seu projeto e ranqueia editais por aderência real, não por palavra-chave.",
  },
  {
    n: "02",
    t: "Scrapers automáticos",
    d: "Monitoramento 3x ao dia em CNPq, FINEP, SEBRAE, BNDES e 27 FAPs estaduais. Nunca perca uma chamada.",
  },
  {
    n: "03",
    t: "Pipeline de candidatura",
    d: "Acompanhe rascunhos, submissões e resultados. Histórico organizado por projeto e por edital.",
  },
  {
    n: "04",
    t: "Lei do Bem integrada",
    d: "Dashboard específico para apuração de incentivos fiscais com auditoria de dispêndios em PD&I.",
  },
  {
    n: "05",
    t: "Consultoria sob demanda",
    d: "Acesso a especialistas para revisão de propostas, defesa técnica e estratégia de captação.",
  },
  {
    n: "06",
    t: "API e exports",
    d: "Integre com seu ERP, CRM ou planilhas. Webhooks para novos editais e mudanças de status.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative hairline-b">
        <div className="absolute inset-0 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-28">
          <div className="eyebrow mb-6">Plataforma · Brasil · 2026</div>
          <h1 className="max-w-5xl text-5xl font-medium leading-[1.05] tracking-tight md:text-7xl">
            O ecossistema brasileiro de fomento,
            <br />
            <span className="text-muted-foreground">organizado em uma só camada.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-base text-muted-foreground md:text-lg">
            Descubra, qualifique e acompanhe editais de CNPq, FINEP, SEBRAE, BNDES, FAPs estaduais
            e Lei do Bem. Inteligência aplicada a R$ 19 bilhões em recursos públicos.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              to="/portal"
              className="inline-flex h-11 items-center rounded-sm bg-foreground px-6 text-sm font-medium text-background hover:opacity-90"
            >
              Explorar o portal →
            </Link>
            <Link
              to="/admin"
              className="inline-flex h-11 items-center rounded-sm hairline px-6 text-sm font-medium hover:bg-secondary"
            >
              Ver backoffice
            </Link>
          </div>

          {/* stats */}
          <div className="mt-20 grid grid-cols-2 hairline-t md:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.k}
                className={`p-6 ${i !== 0 ? "md:border-l border-[var(--hairline)]" : ""} ${
                  i % 2 !== 0 ? "border-l border-[var(--hairline)] md:border-l" : ""
                } ${i >= 2 ? "border-t border-[var(--hairline)] md:border-t-0" : ""}`}
              >
                <div className="font-mono text-3xl md:text-4xl tracking-tight">{s.v}</div>
                <div className="eyebrow mt-2">{s.k}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AGENCIES MARQUEE */}
      <section className="hairline-b">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="eyebrow mb-6">Cobertura · órgãos integrados</div>
          <div className="flex flex-wrap items-center gap-x-10 gap-y-4 text-xl font-medium text-muted-foreground md:text-2xl">
            {agencies.map((a) => (
              <span key={a.name} className="hover:text-foreground transition-colors">
                {a.name}
              </span>
            ))}
            <span className="text-sm font-mono">+ 84 outros</span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="hairline-b">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-4">
              <div className="eyebrow mb-4">Plataforma</div>
              <h2 className="text-3xl font-medium tracking-tight md:text-4xl">
                Tudo que uma equipe de captação precisa, em um único lugar.
              </h2>
            </div>
            <div className="md:col-span-8">
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {features.map((f, i) => (
                  <div
                    key={f.n}
                    className={`p-6 ${i % 2 === 1 ? "sm:border-l border-[var(--hairline)]" : ""} ${
                      i >= 2 ? "border-t border-[var(--hairline)]" : ""
                    }`}
                  >
                    <div className="eyebrow mb-3">{f.n}</div>
                    <h3 className="text-base font-medium">{f.t}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PREVIEW DOS EDITAIS */}
      <section className="hairline-b">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <div className="eyebrow mb-3">Catálogo</div>
              <h2 className="text-3xl font-medium tracking-tight md:text-4xl">
                Editais em destaque agora.
              </h2>
            </div>
            <Link to="/portal/editais" className="text-sm underline-offset-4 hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {editais.slice(0, 6).map((e) => (
              <EditalCard key={e.id} e={e} />
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="hairline-b">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="eyebrow mb-4">Planos</div>
          <h2 className="text-3xl font-medium tracking-tight md:text-4xl">
            Comece grátis. Escale quando precisar.
          </h2>
          <div className="mt-12 grid gap-0 hairline md:grid-cols-3">
            {[
              {
                name: "Explorer",
                price: "R$ 0",
                hint: "para sempre",
                feats: ["50 buscas/mês", "Alertas semanais", "Catálogo público", "1 projeto salvo"],
              },
              {
                name: "Pro",
                price: "R$ 99",
                hint: "/mês por usuário",
                feats: [
                  "Buscas ilimitadas",
                  "Alertas em tempo real",
                  "Match score com IA",
                  "Pipeline de candidaturas",
                  "Exports CSV / API",
                ],
                highlight: true,
              },
              {
                name: "Enterprise",
                price: "Sob consulta",
                hint: "para times de captação",
                feats: [
                  "Workspaces multi-equipe",
                  "Consultoria especializada",
                  "Lei do Bem dashboard",
                  "SSO e auditoria",
                  "SLA dedicado",
                ],
              },
            ].map((p, i) => (
              <div
                key={p.name}
                className={`p-8 ${i !== 0 ? "md:border-l border-[var(--hairline)]" : ""} ${
                  p.highlight ? "bg-foreground text-background" : ""
                }`}
              >
                <div className={`eyebrow ${p.highlight ? "text-background/60" : ""}`}>
                  {p.name}
                </div>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-mono text-4xl tracking-tight">{p.price}</span>
                  <span className={`text-sm ${p.highlight ? "text-background/60" : "text-muted-foreground"}`}>
                    {p.hint}
                  </span>
                </div>
                <ul className="mt-8 space-y-3 text-sm">
                  {p.feats.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className={p.highlight ? "text-background/60" : "text-muted-foreground"}>—</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`mt-10 inline-flex h-10 w-full items-center justify-center rounded-sm text-sm font-medium ${
                    p.highlight
                      ? "bg-background text-foreground hover:opacity-90"
                      : "hairline hover:bg-secondary"
                  }`}
                >
                  {p.highlight ? "Começar grátis" : "Selecionar"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="hairline-b">
        <div className="mx-auto max-w-7xl px-6 py-24 text-center">
          <h2 className="mx-auto max-w-3xl text-4xl font-medium tracking-tight md:text-5xl">
            Pare de perder editais.
            <br />
            <span className="text-muted-foreground">Comece a captar.</span>
          </h2>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              to="/portal"
              className="inline-flex h-11 items-center rounded-sm bg-foreground px-6 text-sm font-medium text-background hover:opacity-90"
            >
              Acessar plataforma
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
