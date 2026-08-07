// Candidaturas: criar, mudar estágio, checklist, detalhe.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const PROGRESSO: Record<string, number> = {
  rascunho: 0,
  aplicando: 25,
  em_revisao: 50,
  submetido: 100,
  aprovado: 100,
  reprovado: 100,
};

export const criarCandidatura = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { editalId: string; projetoId: string }) => input)
  .handler(async ({ data, context }) => {
    // Verifica dono do projeto
    const { data: proj, error: pe } = await context.supabase
      .from("projetos")
      .select("id")
      .eq("id", data.projetoId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (pe) throw new Error(pe.message);
    if (!proj) throw new Error("projeto não encontrado");

    // Se já existe candidatura para (projeto, edital), retorna
    const { data: existe } = await context.supabase
      .from("candidaturas")
      .select("id")
      .eq("projeto_id", data.projetoId)
      .eq("edital_id", data.editalId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existe) return { id: existe.id, novo: false };

    const { data: row, error } = await context.supabase
      .from("candidaturas")
      .insert({
        user_id: context.userId,
        projeto_id: data.projetoId,
        edital_id: data.editalId,
        estagio: "rascunho",
        progresso: 0,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id, novo: true };
  });

export const mudarEstagio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; estagio: string }) => input)
  .handler(async ({ data, context }) => {
    const progresso = PROGRESSO[data.estagio] ?? 0;
    const { error } = await context.supabase
      .from("candidaturas")
      .update({ estagio: data.estagio, progresso })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const salvarObservacoes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; observacoes: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("candidaturas")
      .update({ observacoes: data.observacoes })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getCandidatura = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("candidaturas")
      .select(
        "id, estagio, progresso, observacoes, proposta_md, proposta_gerada_em, created_at, updated_at, projeto:projetos(id, nome, descricao), edital:editais(id, titulo, slug, fonte, data_encerramento, url_original, tipo_apoio, status), consultor:consultores(id, nome, email)",
      )
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const { data: tarefas } = await context.supabase
      .from("candidatura_tarefas")
      .select("id, titulo, feito, ordem")
      .eq("candidatura_id", data.id)
      .order("ordem", { ascending: true });
    return { ...row, tarefas: tarefas ?? [] };
  });

export const salvarProposta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; proposta_md: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("candidaturas")
      .update({ proposta_md: data.proposta_md })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const criarTarefa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { candidaturaId: string; titulo: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("candidatura_tarefas")
      .insert({
        user_id: context.userId,
        candidatura_id: data.candidaturaId,
        titulo: data.titulo,
      })
      .select("id, titulo, feito, ordem")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const toggleTarefa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; feito: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("candidatura_tarefas")
      .update({ feito: data.feito })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removerTarefa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("candidatura_tarefas")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Alertas de prazo (para badge no dashboard)
export const alertasPrazo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  // dias = janela de vencimento (7 por padrão; o painel usa 30)
  .inputValidator((input?: { dias?: number }) => ({ dias: input?.dias ?? 7 }))
  .handler(async ({ data, context }) => {
    const limite = new Date();
    limite.setDate(limite.getDate() + data.dias);
    const { data: rows, error } = await context.supabase
      .from("candidaturas")
      .select("id, estagio, edital:editais(id, titulo, data_encerramento)")
      .eq("user_id", context.userId)
      .in("estagio", ["rascunho", "aplicando", "em_revisao"]);
    if (error) throw new Error(error.message);
    const proximos = (rows ?? []).filter((c) => {
      const dt = (c.edital as { data_encerramento: string | null } | null)?.data_encerramento;
      if (!dt) return false;
      const d = new Date(dt).getTime();
      return d > Date.now() && d < limite.getTime();
    });
    return proximos;
  });
