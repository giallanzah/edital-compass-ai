import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listarUsuariosAdmin } from "@/lib/admin.functions";
import { AdminErrorState } from "@/components/AdminErrorState";

export const Route = createFileRoute("/admin/permissoes")({ component: Page });

const ROLES = [
  {
    role: "SUPER_ADMIN",
    desc: "Acesso completo ao backoffice, incluindo promover/rebaixar outros administradores. O primeiro usuário autenticado a acessar /admin, quando ainda não há nenhum admin cadastrado, se torna SUPER_ADMIN automaticamente (bootstrap_admin).",
  },
  {
    role: "ADMIN",
    desc: "Acesso completo ao backoffice: empresas, projetos, editais, fontes de coleta e usuários. Hoje tem exatamente as mesmas permissões que SUPER_ADMIN — a distinção entre os dois papéis existe no banco, mas nenhuma rota do backoffice ainda restringe uma operação só a SUPER_ADMIN.",
  },
  {
    role: "user",
    desc: "Papel padrão de qualquer conta criada pelo portal. Sem acesso a /admin — bloqueado na camada de aplicação (meuRole()) e, nas server functions administrativas, por assertAdmin().",
  },
];

function Page() {
  const fn = useServerFn(listarUsuariosAdmin);
  const q = useQuery({ queryKey: ["admin", "usuarios"], queryFn: () => fn() });

  if (q.isError) return <AdminErrorState error={q.error as Error} />;
  const usuarios = q.data ?? [];

  const contagem = { SUPER_ADMIN: 0, ADMIN: 0, user: 0 } as Record<string, number>;
  for (const u of usuarios) {
    if (u.roles.includes("SUPER_ADMIN")) contagem.SUPER_ADMIN++;
    else if (u.roles.includes("ADMIN")) contagem.ADMIN++;
    else contagem.user++;
  }

  return (
    <div className="px-8 py-10">
      <div className="eyebrow mb-2">RBAC</div>
      <h1 className="text-3xl font-medium tracking-tight">Permissões</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Modelo real de papéis (tabela <code className="font-mono text-xs">user_roles</code>, enum{" "}
        <code className="font-mono text-xs">app_role</code>). Não há permissões granulares por
        recurso hoje — acesso ao backoffice é tudo-ou-nada por papel.
      </p>

      <div className="mt-8 space-y-5">
        {ROLES.map((r) => (
          <section key={r.role} className="hairline p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-sm bg-foreground px-2 py-0.5 font-mono text-[10px] uppercase text-background">
                    {r.role}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {q.isLoading ? "…" : `${contagem[r.role] ?? 0} conta(s)`}
                  </span>
                </div>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">{r.desc}</p>
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-8 hairline p-5 text-xs text-muted-foreground">
        Para promover ou rebaixar uma conta, use{" "}
        <Link to="/admin/usuarios" className="underline hover:text-foreground">
          Usuários
        </Link>
        .
      </div>
    </div>
  );
}
