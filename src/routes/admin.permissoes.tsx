import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/permissoes")({ component: Page });

const roles = [
  {
    role: "SUPER_ADMIN",
    desc: "Acesso irrestrito à plataforma, incluindo gestão de administradores.",
    perms: ["*"],
  },
  {
    role: "ADMIN",
    desc: "Operações administrativas do dia-a-dia: editais, empresas, financeiro.",
    perms: [
      "editais:*",
      "empresas:*",
      "usuarios:read",
      "financeiro:read",
      "relatorios:*",
      "logs:read",
    ],
  },
  {
    role: "ANALISTA",
    desc: "Curadoria de editais e triagem de projetos.",
    perms: ["editais:read", "editais:update", "projetos:read"],
  },
  {
    role: "VIEWER",
    desc: "Somente leitura em indicadores públicos.",
    perms: ["indicadores:read"],
  },
];

function Page() {
  return (
    <div className="px-8 py-10">
      <div className="eyebrow mb-2">RBAC</div>
      <h1 className="text-3xl font-medium tracking-tight">Permissões</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Controle de acesso baseado em papéis. Alterações são versionadas e auditadas.
      </p>

      <div className="mt-8 space-y-5">
        {roles.map((r) => (
          <section key={r.role} className="hairline p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-sm bg-foreground px-2 py-0.5 font-mono text-[10px] uppercase text-background">
                    {r.role}
                  </span>
                </div>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">{r.desc}</p>
              </div>
              <button className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground">
                editar
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {r.perms.map((p) => (
                <span
                  key={p}
                  className="rounded-sm hairline px-2 py-1 font-mono text-[10px] text-muted-foreground"
                >
                  {p}
                </span>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
