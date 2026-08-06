import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listFontes, dispararColeta, toggleFonteAtiva } from "@/lib/scrape.functions";
import type { FonteSlug } from "@/lib/scrape/normalize";

export const Route = createFileRoute("/admin/fontes")({ component: Page });

type Fonte = {
  id: string;
  slug: string;
  nome: string;
  url_base: string;
  ativo: boolean;
  frequencia_horas: number;
  status_coleta: string;
  ultimo_sucesso_em: string | null;
  ultimo_erro_em: string | null;
  ultima_mensagem: string | null;
};

function Page() {
  const qc = useQueryClient();
  const list = useServerFn(listFontes);
  const disparar = useServerFn(dispararColeta);
  const toggle = useServerFn(toggleFonteAtiva);
  const [runningSlug, setRunningSlug] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const { data: fontes = [] as Fonte[] } = useQuery({
    queryKey: ["admin-fontes"],
    queryFn: () => list() as Promise<Fonte[]>,
  });

  const runAll = useMutation({
    mutationFn: async () => {
      setRunningSlug("todas");
      return await disparar({ data: { fonte: "todas" } });
    },
    onSettled: (res) => {
      setRunningSlug(null);
      setLastResult(res ? JSON.stringify(res.fontes) : null);
      qc.invalidateQueries();
    },
  });

  const runOne = useMutation({
    mutationFn: async (slug: string) => {
      setRunningSlug(slug);
      return await disparar({ data: { fonte: slug as FonteSlug } });
    },
    onSettled: (res) => {
      setRunningSlug(null);
      setLastResult(res ? JSON.stringify(res.fontes) : null);
      qc.invalidateQueries();
    },
  });

  const toggleAtivo = useMutation({
    mutationFn: async (v: { id: string; ativo: boolean }) => toggle({ data: v }),
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin-fontes"] }),
  });

  return (
    <div className="px-8 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-2">Robô Fomenta</div>
          <h1 className="text-3xl font-medium tracking-tight">Fontes monitoradas</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Origens públicas que o robô consulta a cada ciclo. Dispare a coleta manualmente
            ou aguarde o cron agendado.
          </p>
        </div>
        <button
          onClick={() => runAll.mutate()}
          disabled={runAll.isPending}
          className="inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-sm font-medium text-background disabled:opacity-50"
        >
          {runAll.isPending ? "Coletando…" : "Coletar todas agora"}
        </button>
      </div>

      {lastResult && (
        <div className="mt-6 hairline p-4 font-mono text-xs text-muted-foreground">
          <div className="eyebrow mb-1">Última execução</div>
          {lastResult}
        </div>
      )}

      <div className="mt-8 hairline">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 hairline-b eyebrow">
          <div className="col-span-2">Fonte</div>
          <div className="col-span-4">URL base</div>
          <div className="col-span-1">Freq.</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2">Último sucesso</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>
        {fontes.map((f) => (
          <div
            key={f.id}
            className="grid grid-cols-12 items-center gap-4 px-5 py-3 hairline-b last:border-0 text-sm hover:bg-secondary"
          >
            <div className="col-span-2 font-medium">{f.nome}</div>
            <div className="col-span-4 truncate font-mono text-xs text-muted-foreground">
              {f.url_base}
            </div>
            <div className="col-span-1 font-mono text-xs">{f.frequencia_horas}h</div>
            <div className="col-span-1">
              <StatusDot value={f.status_coleta} />
            </div>
            <div className="col-span-2 font-mono text-[11px] text-muted-foreground">
              {f.ultimo_sucesso_em
                ? new Date(f.ultimo_sucesso_em).toLocaleString("pt-BR")
                : "—"}
            </div>
            <div className="col-span-2 flex justify-end gap-3 font-mono text-xs">
              <button
                onClick={() => runOne.mutate(f.slug)}
                disabled={runningSlug === f.slug}
                className="text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                {runningSlug === f.slug ? "…" : "coletar"}
              </button>
              <button
                onClick={() => toggleAtivo.mutate({ id: f.id, ativo: !f.ativo })}
                className="text-muted-foreground hover:text-foreground"
              >
                {f.ativo ? "pausar" : "ativar"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 hairline p-5 text-xs text-muted-foreground">
        <div className="eyebrow mb-2">Agendamento automático</div>
        Endpoint: <code className="font-mono">POST /api/public/cron/scrape</code> com header{" "}
        <code className="font-mono">apikey: SUPABASE_ANON_KEY</code>. Cadastre no{" "}
        <code>pg_cron</code> ou cron externo com intervalo de 6 h.
      </div>
    </div>
  );
}

function StatusDot({ value }: { value: string }) {
  const color =
    value === "ok"
      ? "bg-foreground"
      : value === "warn"
      ? "bg-muted-foreground"
      : "bg-destructive";
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      {value}
    </span>
  );
}
