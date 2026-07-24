// Server functions administrativas (empresas, projetos, usuários, roles, auditoria, dashboard).
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["SUPER_ADMIN", "ADMIN"])
    .limit(1);
  if (!data || data.length === 0) throw new Error("forbidden");
}

// Registro server-side, persistido em public.admin_audit_log — ações críticas
// (promoção de usuário, moderação de fontes/editais, disparo manual de coleta).
export async function registrarAuditoria(
  actorUserId: string,
  actorEmail: string,
  action: string,
  detail?: string,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("admin_audit_log").insert({
    actor_user_id: actorUserId,
    actor_email: actorEmail,
    action,
    detail: detail ?? null,
  });
}

// Logger genérico para eventos client-driven que precisam ficar no audit log
// real (login/logout do backoffice). Ações que já mutam dados (promover
// usuário, toggles etc.) chamam registrarAuditoria() diretamente no handler.
export const registrarEventoAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { action: string; detail?: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const email = (context.claims.email as string | undefined) ?? context.userId;
    await registrarAuditoria(context.userId, email, data.action, data.detail);
    return { ok: true };
  });

export const bootstrapAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("bootstrap_admin");
    if (error) throw new Error(error.message);
    if (data) {
      const email = (context.claims.email as string | undefined) ?? context.userId;
      await registrarAuditoria(context.userId, email, "bootstrap_admin", `Promovido a ${data}`);
    }
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
    const email = (context.claims.email as string | undefined) ?? context.userId;
    await registrarAuditoria(
      context.userId,
      email,
      "promover_usuario",
      `Definiu role ${data.role} para usuário ${data.userId}`,
    );
    return { ok: true };
  });

export const listarAuditLogAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const dashboardAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const desde14dias = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const [
      empresas,
      projetos,
      editaisAtivos,
      editaisRevisao,
      resumosGerados,
      requisitosGerados,
      propostasGeradas,
      candidaturas,
      fontes,
      editaisRecentes,
      usersRes,
    ] = await Promise.all([
      supabaseAdmin.from("empresas_perfil").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("projetos").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("editais")
        .select("id", { count: "exact", head: true })
        .eq("ativo", true)
        .eq("oculto", false),
      supabaseAdmin
        .from("editais")
        .select("id", { count: "exact", head: true })
        .eq("precisa_revisao", true),
      supabaseAdmin
        .from("editais")
        .select("id", { count: "exact", head: true })
        .not("resumo_ia", "is", null),
      supabaseAdmin
        .from("editais")
        .select("id", { count: "exact", head: true })
        .not("requisitos_ia", "is", null),
      supabaseAdmin
        .from("candidaturas")
        .select("id", { count: "exact", head: true })
        .not("proposta_md", "is", null),
      supabaseAdmin.from("candidaturas").select("estagio"),
      supabaseAdmin
        .from("fontes_monitoradas")
        .select(
          "slug, nome, ativo, status_coleta, ultimo_sucesso_em, ultimo_erro_em, ultima_mensagem",
        )
        .order("slug"),
      supabaseAdmin.from("editais").select("coletado_em").gte("coletado_em", desde14dias),
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
    ]);

    const candidaturasPorEstagio: Record<string, number> = {};
    for (const c of candidaturas.data ?? []) {
      const k = (c.estagio as string) || "rascunho";
      candidaturasPorEstagio[k] = (candidaturasPorEstagio[k] ?? 0) + 1;
    }

    const editaisPorDia: Record<string, number> = {};
    for (const e of editaisRecentes.data ?? []) {
      const dia = (e.coletado_em as string).slice(0, 10);
      editaisPorDia[dia] = (editaisPorDia[dia] ?? 0) + 1;
    }

    return {
      empresas: empresas.count ?? 0,
      usuarios: usersRes.data?.users.length ?? 0,
      projetos: projetos.count ?? 0,
      editaisAtivos: editaisAtivos.count ?? 0,
      editaisPrecisamRevisao: editaisRevisao.count ?? 0,
      resumosGerados: resumosGerados.count ?? 0,
      requisitosGerados: requisitosGerados.count ?? 0,
      propostasGeradas: propostasGeradas.count ?? 0,
      candidaturasPorEstagio,
      fontes: fontes.data ?? [],
      editaisPorDia,
    };
  });
