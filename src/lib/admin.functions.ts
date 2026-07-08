// Server functions administrativas (empresas, projetos, usuários, roles).
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["SUPER_ADMIN", "ADMIN"])
    .limit(1);
  if (!data || data.length === 0) throw new Error("forbidden");
}

export const bootstrapAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("bootstrap_admin");
    if (error) throw new Error(error.message);
    return { role: data as string | null };
  });

export const meuRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const roles = (data ?? []).map((r) => r.role as string);
    return { roles, isAdmin: roles.includes("ADMIN") || roles.includes("SUPER_ADMIN") };
  });

export const listarEmpresasAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("empresas_perfil")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listarProjetosAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("projetos")
      .select("id, nome, descricao, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    // Contagem de candidaturas por projeto
    const { data: cand } = await supabaseAdmin.from("candidaturas").select("projeto_id, estagio");
    const map: Record<string, { total: number; ativos: number }> = {};
    for (const c of cand ?? []) {
      const k = c.projeto_id as string;
      if (!map[k]) map[k] = { total: 0, ativos: 0 };
      map[k].total++;
      if (["rascunho", "aplicando", "em_revisao"].includes(c.estagio as string)) map[k].ativos++;
    }
    return (data ?? []).map((p) => ({ ...p, candidaturas: map[p.id] ?? { total: 0, ativos: 0 } }));
  });

export const listarUsuariosAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    if (error) throw new Error(error.message);
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const roleMap: Record<string, string[]> = {};
    for (const r of roles ?? []) {
      const k = r.user_id as string;
      if (!roleMap[k]) roleMap[k] = [];
      roleMap[k].push(r.role as string);
    }
    return (users?.users ?? []).map((u) => ({
      id: u.id,
      email: u.email ?? "",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      roles: roleMap[u.id] ?? [],
    }));
  });

export const promoverUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; role: "SUPER_ADMIN" | "ADMIN" | "user" }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("promover_usuario", {
      _alvo: data.userId,
      _role: data.role,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
