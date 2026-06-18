import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/usuarios")({
  component: Usuarios,
});

const users = [
  { name: "Hugo Giallanza", email: "hugo@brasil-startups.org", plan: "Enterprise", since: "12/01/2026" },
  { name: "Marina Tavares", email: "marina@inovate.co", plan: "Pro", since: "03/02/2026" },
  { name: "Rafael Andrade", email: "rafael@bioagro.com.br", plan: "Pro", since: "18/02/2026" },
  { name: "Camila Souza", email: "camila@deeptech.ai", plan: "Explorer", since: "22/03/2026" },
  { name: "Lucas Mendes", email: "lucas@energiaviva.com", plan: "Pro", since: "04/04/2026" },
  { name: "Patrícia Lima", email: "patricia@saudemais.org", plan: "Explorer", since: "10/05/2026" },
];

function Usuarios() {
  return (
    <div className="px-8 py-10">
      <div className="eyebrow mb-2">CRM</div>
      <h1 className="text-3xl font-medium tracking-tight">Usuários</h1>

      <div className="mt-8 hairline">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 hairline-b eyebrow">
          <div className="col-span-4">Nome</div>
          <div className="col-span-4">E-mail</div>
          <div className="col-span-2">Plano</div>
          <div className="col-span-2 text-right">Cliente desde</div>
        </div>
        {users.map((u) => (
          <div
            key={u.email}
            className="grid grid-cols-12 items-center gap-4 px-5 py-3 hairline-b last:border-0 text-sm hover:bg-secondary"
          >
            <div className="col-span-4 flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary font-mono text-[10px] uppercase">
                {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </div>
              {u.name}
            </div>
            <div className="col-span-4 font-mono text-xs text-muted-foreground">{u.email}</div>
            <div className="col-span-2">
              <span className="hairline rounded-sm px-2 py-0.5 font-mono text-[10px] uppercase">
                {u.plan}
              </span>
            </div>
            <div className="col-span-2 text-right font-mono text-xs text-muted-foreground">
              {u.since}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
