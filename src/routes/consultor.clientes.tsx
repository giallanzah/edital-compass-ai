import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listarClientesDoConsultor } from "@/lib/consultor.functions";
import { AdminErrorState } from "@/components/AdminErrorState";

export const Route = createFileRoute("/consultor/clientes")({ component: Page });

function Page() {
  // /consultor/clientes/$id é filha desta rota — sem esse check, a filha
  // carrega mas nunca aparece (o pai não teria onde montar seu <Outlet />).
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isIndex = pathname === "/consultor/clientes";

  const fn = useServerFn(listarClientesDoConsultor);
  const q = useQuery({
    queryKey: ["consultor", "clientes"],
    queryFn: () => fn(),
    enabled: isIndex,
  });

  if (!isIndex) return <Outlet />;
  if (q.isError) return <AdminErrorState error={q.error as Error} />;

  const clientes = q.data ?? [];

  return (
    <div className="px-8 py-10">
      <div className="eyebrow mb-2">Carteira</div>
      <h1 className="text-3xl font-medium tracking-tight">Clientes</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Empresas com contrato ativo com você. Clique para abrir o Kanban de candidaturas.
      </p>

      <div className="mt-8 hairline">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 hairline-b eyebrow">
          <div className="col-span-3">Empresa</div>
          <div className="col-span-2">Setor / porte</div>
          <div className="col-span-2 text-right">Candidaturas</div>
          <div className="col-span-2 text-right">Créditos</div>
          <div className="col-span-2 text-right">Contrato até</div>
          <div className="col-span-1 text-right">Status</div>
        </div>
        {q.isLoading ? (
          <div className="p-5 text-sm text-muted-foreground">Carregando…</div>
        ) : clientes.length === 0 ? (
          <div className="p-5 text-sm text-muted-foreground">
            Nenhum cliente vinculado a você ainda.
          </div>
        ) : (
          clientes.map((c) => (
            <Link
              key={c.contratoId}
              to="/consultor/clientes/$id"
              params={{ id: c.empresaId }}
              className="grid grid-cols-12 items-center gap-4 px-5 py-3 hairline-b text-sm last:border-0 hover:bg-secondary"
            >
              <div className="col-span-3 font-medium">{c.nomeEmpresa}</div>
              <div className="col-span-2 text-xs text-muted-foreground">
                {[c.setor, c.porte].filter(Boolean).join(" · ") || "—"}
              </div>
              <div className="col-span-2 text-right font-mono text-xs">
                {c.candidaturas.total}{" "}
                <span className="text-muted-foreground">({c.candidaturas.ativas} ativas)</span>
              </div>
              <div className="col-span-2 text-right font-mono text-xs">
                {c.creditosRestantes}/{c.creditosContratados}
              </div>
              <div className="col-span-2 text-right font-mono text-[11px] text-muted-foreground">
                {c.contratoFim ? new Date(c.contratoFim).toLocaleDateString("pt-BR") : "sem data"}
              </div>
              <div className="col-span-1 text-right">
                <span
                  className={`rounded-sm px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                    c.status === "ativo" ? "bg-foreground text-background" : "hairline"
                  }`}
                >
                  {c.status}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
