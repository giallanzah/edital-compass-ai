import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { listarUsuariosAdmin, promoverUsuario } from "@/lib/admin.functions";
import { AdminErrorState } from "@/components/AdminErrorState";

export const Route = createFileRoute("/admin/usuarios")({ component: Page });

type Usuario = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
};

function roleLabel(roles: string[]) {
  if (roles.includes("SUPER_ADMIN")) return "SUPER_ADMIN";
  if (roles.includes("ADMIN")) return "ADMIN";
  return "user";
}

function Page() {
  const qc = useQueryClient();
  const listFn = useServerFn(listarUsuariosAdmin);
  const promFn = useServerFn(promoverUsuario);
  const q = useQuery({ queryKey: ["admin", "usuarios"], queryFn: () => listFn() });
  const [busca, setBusca] = useState("");
  const [confirmando, setConfirmando] = useState<{ id: string; role: string } | null>(null);

  const promMut = useMutation({
    mutationFn: async (v: { userId: string; role: "SUPER_ADMIN" | "ADMIN" | "user" }) =>
      promFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "usuarios"] });
      setConfirmando(null);
    },
  });

  const rows = (q.data ?? []) as Usuario[];
  const filtradas = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) => r.email.toLowerCase().includes(t));
  }, [rows, busca]);

  if (q.isError) return <AdminErrorState error={q.error as Error} />;

  return (
    <div className="px-8 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-2">CRM</div>
          <h1 className="text-3xl font-medium tracking-tight">Usuários</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Contas registradas no portal. Promova ou rebaixe perfis administrativos.
          </p>
        </div>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por e-mail…"
          className="h-9 w-72 rounded-sm hairline bg-background px-3 text-sm"
        />
      </div>

      <div className="mt-8 hairline">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 hairline-b eyebrow">
          <div className="col-span-5">E-mail</div>
          <div className="col-span-2">Role atual</div>
          <div className="col-span-2 text-right">Último login</div>
          <div className="col-span-3 text-right">Ações</div>
        </div>
        {q.isLoading ? (
          <div className="p-5 text-sm text-muted-foreground">Carregando…</div>
        ) : filtradas.length === 0 ? (
          <div className="p-5 text-sm text-muted-foreground">Nenhum usuário.</div>
        ) : (
          filtradas.map((u) => {
            const atual = roleLabel(u.roles);
            return (
              <div
                key={u.id}
                className="grid grid-cols-12 items-center gap-4 px-5 py-3 hairline-b text-sm last:border-0"
              >
                <div className="col-span-5">
                  <div className="font-mono text-xs">{u.email}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    {u.id.slice(0, 8)}… · criado {new Date(u.created_at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <div className="col-span-2">
                  <span
                    className={`rounded-sm px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                      atual === "SUPER_ADMIN" || atual === "ADMIN"
                        ? "bg-foreground text-background"
                        : "hairline"
                    }`}
                  >
                    {atual}
                  </span>
                </div>
                <div className="col-span-2 text-right font-mono text-[10px] text-muted-foreground">
                  {u.last_sign_in_at
                    ? new Date(u.last_sign_in_at).toLocaleDateString("pt-BR")
                    : "nunca"}
                </div>
                <div className="col-span-3 flex justify-end gap-1 font-mono text-[10px] uppercase">
                  {atual !== "ADMIN" && (
                    <button
                      onClick={() => setConfirmando({ id: u.id, role: "ADMIN" })}
                      className="rounded-sm hairline px-2 py-1 hover:bg-secondary"
                    >
                      promover admin
                    </button>
                  )}
                  {atual !== "user" && (
                    <button
                      onClick={() => setConfirmando({ id: u.id, role: "user" })}
                      className="rounded-sm hairline px-2 py-1 text-destructive hover:bg-destructive/10"
                    >
                      rebaixar
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {confirmando && (
        <div
          onClick={() => setConfirmando(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm hairline bg-background p-6"
          >
            <div className="eyebrow mb-2">Confirmar alteração</div>
            <p className="text-sm">
              Aplicar role <span className="font-mono">{confirmando.role}</span> a este usuário?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setConfirmando(null)}
                className="inline-flex h-9 items-center rounded-sm hairline px-3 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() =>
                  promMut.mutate({
                    userId: confirmando.id,
                    role: confirmando.role as "ADMIN" | "user",
                  })
                }
                disabled={promMut.isPending}
                className="inline-flex h-9 items-center rounded-sm bg-foreground px-3 text-sm font-medium text-background disabled:opacity-40"
              >
                {promMut.isPending ? "Aplicando…" : "Confirmar"}
              </button>
            </div>
            {promMut.error && (
              <div className="mt-3 text-[11px] text-destructive">
                {(promMut.error as Error).message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
