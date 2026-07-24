// Server functions consumíveis do frontend (portal + backoffice).
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin, registrarAuditoria } from "./admin.functions";

export type EditalResumo = {
  id: string;
  titulo: string;
  slug: string;
  fonte: string;
  url_original: string;
  descricao_curta: string | null;
  data_encerramento: string | null;
  data_publicacao: string | null;
  status: string;
  tipo_apoio: string | null;
  publico_alvo: string[] | null;
  tema: string[] | null;
  abrangencia: string | null;
  confianca_extracao: number;
  coletado_em: string;
};

export type EditalFiltros = {
  busca?: string;
  fonte?: string;
  status?: string;
  tema?: string;
  tipo_apoio?: string;
  limite?: number;
};

export const listEditais = createServerFn({ method: "GET" })
  .inputValidator((input: EditalFiltros | undefined) => input ?? {})
  .handler(async ({ data }): Promise<{ items: EditalResumo[]; total: number }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("editais")
      .select(
        "id, titulo, slug, fonte, url_original, descricao_curta, data_encerramento, data_publicacao, status, tipo_apoio, publico_alvo, tema, abrangencia, confianca_extracao, coletado_em",
        { count: "exact" },
      )
      .eq("ativo", true)
      .eq("oculto", false)
      .order("coletado_em", { ascending: false })
      .limit(data.limite ?? 100);

    if (data.fonte) q = q.eq("fonte", data.fonte);
    if (data.status) q = q.eq("status", data.status);
    if (data.tipo_apoio) q = q.eq("tipo_apoio", data.tipo_apoio);
    if (data.tema) q = q.contains("tema", [data.tema]);
    if (data.busca && data.busca.trim()) {
      const b = data.busca.trim().replace(/[%,]/g, "");
      q = q.or(`titulo.ilike.%${b}%,descricao_curta.ilike.%${b}%`);
    }
    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { items: (rows ?? []) as EditalResumo[], total: count ?? 0 };
  });

export const contagemPorFonte = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("editais")
    .select("fonte")
    .eq("ativo", true)
    .eq("oculto", false);
  if (error) throw new Error(error.message);
  const map: Record<string, number> = {};
  for (const row of data ?? []) {
    map[row.fonte] = (map[row.fonte] ?? 0) + 1;
  }
  return { total: data?.length ?? 0, porFonte: map };
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getEdital = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Aceita UUID ou slug — URLs públicas usam slug (SEO).
    const coluna = UUID_RE.test(data.id) ? "id" : "slug";
    const { data: edital, error } = await supabaseAdmin
      .from("editais")
      .select("*")
      .eq(coluna, data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!edital) return null;
    const { data: historico } = await supabaseAdmin
      .from("editais_historico")
      .select("id, hash_conteudo, criado_em")
      .eq("edital_id", edital.id)
      .order("criado_em", { ascending: false })
      .limit(10);
    return { edital, historico: historico ?? [] };
  });

export const listFontes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("fontes_monitoradas")
      .select("*")
      .order("slug");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// Fontes monitoradas + resumo da última coleta de cada uma (usado no monitor
// de jobs em /admin/scrapers).
export const listFontesComUltimaColeta = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: fontes, error: fe }, { data: logs, error: le }] = await Promise.all([
      supabaseAdmin.from("fontes_monitoradas").select("*").order("slug"),
      supabaseAdmin
        .from("logs_coleta")
        .select("fonte_slug, iniciado_em, finalizado_em, status, total_novos")
        .order("iniciado_em", { ascending: false })
        .limit(500),
    ]);
    if (fe) throw new Error(fe.message);
    if (le) throw new Error(le.message);
    const ultimaPorFonte: Record<string, (typeof logs)[number]> = {};
    for (const l of logs ?? []) {
      if (!ultimaPorFonte[l.fonte_slug as string]) ultimaPorFonte[l.fonte_slug as string] = l;
    }
    return (fontes ?? []).map((f) => ({
      ...f,
      ultimaColeta: ultimaPorFonte[f.slug as string] ?? null,
    }));
  });

export const listLogsColeta = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("logs_coleta")
      .select("*")
      .order("iniciado_em", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const dispararColeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { fonte: "cnpq" | "finep" | "sebrae" | "bndes" | "todas" }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { runScrape } = await import("./scrape/robot.server");
    const result = await runScrape(data.fonte);
    const email = (context.claims.email as string | undefined) ?? context.userId;
    await registrarAuditoria(context.userId, email, "disparar_coleta", `Fonte: ${data.fonte}`);
    return result;
  });

export const toggleFonteAtiva = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; ativo: boolean }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("fontes_monitoradas")
      .update({ ativo: data.ativo })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    const email = (context.claims.email as string | undefined) ?? context.userId;
    await registrarAuditoria(
      context.userId,
      email,
      "toggle_fonte",
      `Fonte ${data.id} → ${data.ativo ? "ativada" : "pausada"}`,
    );
    return { ok: true };
  });

export const toggleEditalOculto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; oculto: boolean }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("editais")
      .update({ oculto: data.oculto })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    const email = (context.claims.email as string | undefined) ?? context.userId;
    await registrarAuditoria(
      context.userId,
      email,
      "toggle_edital_oculto",
      `Edital ${data.id} → ${data.oculto ? "ocultado" : "visível"}`,
    );
    return { ok: true };
  });

export const listEditaisAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("editais")
      .select(
        "id, titulo, slug, fonte, status, tipo_apoio, data_encerramento, confianca_extracao, ativo, oculto, precisa_revisao, coletado_em",
      )
      .order("coletado_em", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
