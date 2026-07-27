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

// -------- Consultores (CRM interno) --------

export const listarConsultoresAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("consultores").select("*").order("nome");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// Vincula um usuário JÁ EXISTENTE como consultor — nunca cria conta nova.
export const credenciarConsultorAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      userId: string;
      nome: string;
      email: string;
      telefone?: string | null;
      especialidade?: string | null;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("credenciar_consultor", {
      _alvo: data.userId,
      _nome: data.nome,
      _email: data.email,
      _telefone: data.telefone ?? undefined,
      _especialidade: data.especialidade ?? undefined,
    });
    if (error) throw new Error(error.message);
    const email = (context.claims.email as string | undefined) ?? context.userId;
    await registrarAuditoria(
      context.userId,
      email,
      "credenciar_consultor",
      `Credenciou ${data.email} (${data.userId}) como consultor`,
    );
    return { ok: true };
  });

export const atualizarConsultorAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      id: string;
      nome?: string;
      telefone?: string | null;
      especialidade?: string | null;
      ativo?: boolean;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: {
      nome?: string;
      telefone?: string | null;
      especialidade?: string | null;
      ativo?: boolean;
    } = {};
    if (data.nome !== undefined) patch.nome = data.nome;
    if (data.telefone !== undefined) patch.telefone = data.telefone;
    if (data.especialidade !== undefined) patch.especialidade = data.especialidade;
    if (data.ativo !== undefined) patch.ativo = data.ativo;
    const { error } = await supabaseAdmin.from("consultores").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listarContratosAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("consultor_clientes")
      .select(
        "*, consultor:consultores(id, nome, email), empresa:empresas_perfil(id, nome_empresa)",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const criarContratoAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      consultorId: string;
      empresaId: string;
      contratoInicio: string;
      contratoFim?: string | null;
      creditosContratados: number;
      observacoes?: string | null;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("consultor_clientes")
      .insert({
        consultor_id: data.consultorId,
        empresa_id: data.empresaId,
        contrato_inicio: data.contratoInicio,
        contrato_fim: data.contratoFim ?? null,
        creditos_contratados: data.creditosContratados,
        observacoes: data.observacoes ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    const email = (context.claims.email as string | undefined) ?? context.userId;
    await registrarAuditoria(
      context.userId,
      email,
      "criar_contrato_consultor",
      `Contrato consultor ${data.consultorId} ↔ empresa ${data.empresaId}`,
    );
    return row;
  });

export const atualizarContratoAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      id: string;
      status?: string;
      contratoFim?: string | null;
      creditosContratados?: number;
      creditosUtilizados?: number;
      observacoes?: string | null;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: {
      status?: string;
      contrato_fim?: string | null;
      creditos_contratados?: number;
      creditos_utilizados?: number;
      observacoes?: string | null;
    } = {};
    if (data.status !== undefined) patch.status = data.status;
    if (data.contratoFim !== undefined) patch.contrato_fim = data.contratoFim;
    if (data.creditosContratados !== undefined)
      patch.creditos_contratados = data.creditosContratados;
    if (data.creditosUtilizados !== undefined) patch.creditos_utilizados = data.creditosUtilizados;
    if (data.observacoes !== undefined) patch.observacoes = data.observacoes;
    const { error } = await supabaseAdmin
      .from("consultor_clientes")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
