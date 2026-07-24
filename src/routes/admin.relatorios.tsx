import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  listarEmpresasAdmin,
  listarProjetosAdmin,
  listarUsuariosAdmin,
} from "@/lib/admin.functions";
import { listEditaisAdmin } from "@/lib/scrape.functions";

export const Route = createFileRoute("/admin/relatorios")({ component: Page });

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [cols.join(",")];
  for (const row of rows) lines.push(cols.map((c) => escape(row[c])).join(","));
  return lines.join("\n");
}

function download(filename: string, csv: string) {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type Report = {
  key: string;
  nome: string;
  descricao: string;
  run: () => Promise<Record<string, unknown>[]>;
};

function Page() {
  const editaisFn = useServerFn(listEditaisAdmin);
  const empresasFn = useServerFn(listarEmpresasAdmin);
  const projetosFn = useServerFn(listarProjetosAdmin);
  const usuariosFn = useServerFn(listarUsuariosAdmin);

  const reports: Report[] = [
    {
      key: "editais",
      nome: "Editais",
      descricao: "Últimos 200 editais coletados, com status, fonte e confiança de extração.",
      run: async () => (await editaisFn()) as unknown as Record<string, unknown>[],
    },
    {
      key: "empresas",
      nome: "Empresas",
      descricao: "Perfis de empresa cadastrados no portal (até 500).",
      run: async () => (await empresasFn()) as unknown as Record<string, unknown>[],
    },
    {
      key: "projetos",
      nome: "Projetos",
      descricao: "Projetos cadastrados e contagem de candidaturas por projeto (até 500).",
      run: async () =>
        (await projetosFn()).map((p) => ({
          ...p,
          candidaturas_total: p.candidaturas.total,
          candidaturas_ativas: p.candidaturas.ativos,
        })) as unknown as Record<string, unknown>[],
    },
    {
      key: "usuarios",
      nome: "Usuários",
      descricao: "Contas registradas, role atual e último login (até 200).",
      run: async () =>
        (await usuariosFn()).map((u) => ({ ...u, roles: u.roles.join("|") })) as unknown as Record<
          string,
          unknown
        >[],
    },
  ];

  return (
    <div className="px-8 py-10">
      <div className="eyebrow mb-2">Exportações</div>
      <h1 className="text-3xl font-medium tracking-tight">Relatórios</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Exportação sob demanda dos dados reais atuais em CSV. Não há relatórios agendados nem envio
        automático por e-mail implementados — cada exportação roda a consulta no momento do clique.
      </p>

      <div className="mt-8 hairline divide-y divide-[var(--hairline)]">
        {reports.map((r) => (
          <ReportRow key={r.key} report={r} />
        ))}
      </div>
    </div>
  );
}

function ReportRow({ report }: { report: Report }) {
  const [rows, setRows] = useState<number | null>(null);
  const mut = useMutation({
    mutationFn: report.run,
    onSuccess: (data) => {
      setRows(data.length);
      download(`${report.key}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(data));
    },
  });

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div>
        <div className="text-sm font-medium">{report.nome}</div>
        <p className="mt-1 max-w-xl text-xs text-muted-foreground">{report.descricao}</p>
        {rows !== null && (
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            última exportação: {rows} linha(s)
          </p>
        )}
        {mut.isError && (
          <p className="mt-1 text-[11px] text-destructive">{(mut.error as Error).message}</p>
        )}
      </div>
      <button
        onClick={() => mut.mutate()}
        disabled={mut.isPending}
        className="inline-flex h-9 shrink-0 items-center rounded-sm bg-foreground px-4 text-sm font-medium text-background disabled:opacity-50"
      >
        {mut.isPending ? "Gerando…" : "Exportar CSV"}
      </button>
    </div>
  );
}
