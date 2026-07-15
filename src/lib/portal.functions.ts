// Server functions do portal autenticado.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeMatchLocal, type EditalParaMatch, type PerfilParaMatch } from "./match";

// ---------- Perfil ----------
export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("empresas_perfil")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export type PerfilInput = {
  nome_empresa: string;
  cnpj?: string | null;
  setor?: string | null;
  porte?: string | null;
  uf?: string | null;
  estagio?: string | null;
  temas: string[];
  faturamento_faixa?: string | null;
};

export const upsertMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: PerfilInput) => input)
  .handler(async ({ data, context }) => {
    const payload = {
      user_id: context.userId,
      nome_empresa: data.nome_empresa,
      cnpj: data.cnpj ?? null,
      setor: data.setor ?? null,
      porte: data.porte ?? null,
      uf: data.uf ?? null,
      estagio: data.estagio ?? null,
      temas: data.temas ?? [],
      faturamento_faixa: data.faturamento_faixa ?? null,
    };
    const { data: row, error } = await context.supabase
      .from("empresas_perfil")
      .upsert(payload, { onConflict: "user_id" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ---------- Match ----------
export const computeMatch = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { editalId: string }) => input)
  .handler(async ({ data, context }) => {
    const [{ data: edital }, { data: perfil }] = await Promise.all([
      context.supabase
        .from("editais")
        .select("status, tema, publico_alvo, abrangencia, uf, tipo_apoio")
        .eq("id", data.editalId)
        .maybeSingle(),
      context.supabase
        .from("empresas_perfil")
        .select("temas, porte, uf, estagio")
        .eq("user_id", context.userId)
        .maybeSingle(),
    ]);
    if (!edital) return null;
    if (!perfil) return { needsProfile: true as const };
    return computeMatchLocal(edital as EditalParaMatch, perfil as PerfilParaMatch);
  });

// Recomendados: top editais ABERTOS por match
export const getRecomendados = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: perfil } = await context.supabase
      .from("empresas_perfil")
      .select("temas, porte, uf, estagio")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!perfil) return { needsProfile: true as const, items: [] };
    const { data: rows, error } = await context.supabase
      .from("editais")
      .select(
        "id, titulo, fonte, tipo_apoio, status, tema, publico_alvo, abrangencia, uf, data_encerramento, descricao_curta",
      )
      .eq("ativo", true)
      .eq("oculto", false)
      .eq("status", "aberto")
      .limit(80);
    if (error) throw new Error(error.message);
    const scored = (rows ?? [])
      .map((e) => ({
        edital: e,
        match: computeMatchLocal(e as EditalParaMatch, perfil as PerfilParaMatch),
      }))
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, 6);
    return { needsProfile: false as const, items: scored };
  });

// ---------- Projetos ----------
export const listMyProjetos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("projetos")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createProjeto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { nome: string; descricao?: string | null }) => input)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("projetos")
      .insert({
        user_id: context.userId,
        nome: data.nome,
        descricao: data.descricao ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateProjeto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; nome?: string; descricao?: string | null }) => input)
  .handler(async ({ data, context }) => {
    const patch: { nome?: string; descricao?: string | null } = {};
    if (data.nome !== undefined) patch.nome = data.nome;
    if (data.descricao !== undefined) patch.descricao = data.descricao;
    const { data: row, error } = await context.supabase
      .from("projetos")
      .update(patch)
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteProjeto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("projetos")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Candidaturas ----------
export const listMyCandidaturas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("candidaturas")
      .select(
        "id, estagio, progresso, created_at, updated_at, projeto:projetos(id, nome), edital:editais(id, titulo, fonte, data_encerramento)",
      )
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ---------- Landing (público) ----------
export const publicStats = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [ativos, fontes] = await Promise.all([
    supabaseAdmin
      .from("editais")
      .select("id", { count: "exact", head: true })
      .eq("ativo", true)
      .eq("oculto", false),
    supabaseAdmin
      .from("fontes_monitoradas")
      .select("id", { count: "exact", head: true })
      .eq("ativo", true),
  ]);
  return {
    editaisAtivos: ativos.count ?? 0,
    fontesMonitoradas: fontes.count ?? 0,
    frequenciaAtualizacao: "4x ao dia",
  };
});

export const editaisDestaque = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("editais")
    .select(
      "id, titulo, fonte, tipo_apoio, status, data_encerramento, descricao_curta, abrangencia",
    )
    .eq("ativo", true)
    .eq("oculto", false)
    .in("status", ["aberto", "encerrando_em_breve"])
    .order("coletado_em", { ascending: false })
    .limit(6);
  if (error) throw new Error(error.message);
  return data ?? [];
});

// ---------- Notificações ----------
export type NotifPrefs = {
  email: string;
  alertas_prazo: boolean;
  alertas_novos_editais: boolean;
  min_score: number;
};

export const getNotifPrefs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("notif_preferencias")
      .select("email, alertas_prazo, alertas_novos_editais, min_score")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const saveNotifPrefs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: NotifPrefs) => input)
  .handler(async ({ data, context }) => {
    const payload = {
      user_id: context.userId,
      email: data.email,
      alertas_prazo: data.alertas_prazo,
      alertas_novos_editais: data.alertas_novos_editais,
      min_score: Math.max(0, Math.min(100, data.min_score | 0)),
    };
    const { error } = await context.supabase
      .from("notif_preferencias")
      .upsert(payload, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
