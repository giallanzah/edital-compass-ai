// Server functions do backoffice do consultor (CRM interno).
import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PROGRESSO } from "./candidatura.functions";

// Segurança real é a RLS (policies "consultor_*"); isto só dá uma mensagem
// amigável e o id do consultor para as queries seguintes.
async function assertConsultor(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from("consultores")
    .select("id, ativo")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || !data.ativo) throw new Error("forbidden");
  return data;
}

export const meuConsultorId = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("consultores")
      .select("id, nome, email, telefone, especialidade, ativo")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

// Resumo para o dashboard: total de clientes, créditos restantes agregados
// e candidaturas por estágio, olhando a carteira inteira do consultor.
export const dashboardConsultor = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const consultor = await assertConsultor(context.supabase, context.userId);

    const { data: contratos, error } = await context.supabase
      .from("consultor_clientes")
      .select("status, creditos_contratados, creditos_utilizados, empresa:empresas_perfil(user_id)")
      .eq("consultor_id", consultor.id);
    if (error) throw new Error(error.message);

    const ativos = (contratos ?? []).filter((c) => c.status === "ativo");
    const creditosRestantes = ativos.reduce(
      (acc, c) => acc + (c.creditos_contratados - c.creditos_utilizados),
      0,
    );
    const userIds = ativos
      .map((c) => (c.empresa as { user_id: string } | null)?.user_id)
      .filter((v): v is string => Boolean(v));

    const candidaturasPorEstagio: Record<string, number> = {};
    if (userIds.length > 0) {
      const { data: cands } = await context.supabase
        .from("candidaturas")
        .select("estagio")
        .in("user_id", userIds);
      for (const c of cands ?? []) {
        candidaturasPorEstagio[c.estagio] = (candidaturasPorEstagio[c.estagio] ?? 0) + 1;
      }
    }

    return {
      totalClientes: ativos.length,
      creditosRestantes,
      candidaturasPorEstagio,
    };
  });

export const listarClientesDoConsultor = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const consultor = await assertConsultor(context.supabase, context.userId);

    const { data: contratos, error } = await context.supabase
      .from("consultor_clientes")
      .select(
        "id, empresa_id, status, contrato_inicio, contrato_fim, creditos_contratados, creditos_utilizados, observacoes, empresa:empresas_perfil(id, nome_empresa, setor, porte, uf, user_id)",
      )
      .eq("consultor_id", consultor.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const userIds = (contratos ?? [])
      .map((c) => (c.empresa as { user_id: string } | null)?.user_id)
      .filter((v): v is string => Boolean(v));

    const porUser: Record<string, { total: number; ativas: number }> = {};
    if (userIds.length > 0) {
      const { data: cands } = await context.supabase
        .from("candidaturas")
        .select("user_id, estagio")
        .in("user_id", userIds);
      for (const c of cands ?? []) {
        const k = c.user_id;
        if (!porUser[k]) porUser[k] = { total: 0, ativas: 0 };
        porUser[k].total++;
        if (["rascunho", "aplicando", "em_revisao"].includes(c.estagio)) porUser[k].ativas++;
      }
    }

    return (contratos ?? []).map((c) => {
      const empresa = c.empresa as {
        id: string;
        nome_empresa: string;
        setor: string | null;
        porte: string | null;
        uf: string | null;
        user_id: string;
      } | null;
      const stats = (empresa && porUser[empresa.user_id]) ?? { total: 0, ativas: 0 };
      return {
        contratoId: c.id,
        empresaId: c.empresa_id,
        nomeEmpresa: empresa?.nome_empresa ?? "—",
        setor: empresa?.setor ?? null,
        porte: empresa?.porte ?? null,
        uf: empresa?.uf ?? null,
        status: c.status,
        contratoInicio: c.contrato_inicio,
        contratoFim: c.contrato_fim,
        creditosContratados: c.creditos_contratados,
        creditosUtilizados: c.creditos_utilizados,
        creditosRestantes: c.creditos_contratados - c.creditos_utilizados,
        observacoes: c.observacoes,
        candidaturas: stats,
      };
    });
  });

export const listarKanbanCliente = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { empresaId: string }) => input)
  .handler(async ({ data, context }) => {
    await assertConsultor(context.supabase, context.userId);

    const { data: empresa, error: ee } = await context.supabase
      .from("empresas_perfil")
      .select("id, nome_empresa, user_id")
      .eq("id", data.empresaId)
      .maybeSingle();
    if (ee) throw new Error(ee.message);
    if (!empresa) throw new Error("cliente não encontrado ou fora da sua carteira");

    const { data: cands, error } = await context.supabase
      .from("candidaturas")
      .select(
        "id, estagio, progresso, consultor_id, updated_at, projeto:projetos(id, nome), edital:editais(id, titulo, fonte, data_encerramento)",
      )
      .eq("user_id", empresa.user_id)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);

    return {
      empresa: { id: empresa.id, nome_empresa: empresa.nome_empresa },
      candidaturas: cands ?? [],
    };
  });

export const moverEstagioConsultor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; estagio: string }) => input)
  .handler(async ({ data, context }) => {
    const consultor = await assertConsultor(context.supabase, context.userId);
    const progresso = PROGRESSO[data.estagio] ?? 0;
    const { data: row, error } = await context.supabase
      .from("candidaturas")
      .update({ estagio: data.estagio, progresso, consultor_id: consultor.id })
      .eq("id", data.id)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("candidatura não encontrada ou fora da sua carteira");
    return { ok: true };
  });

export const listarAtividades = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const consultor = await assertConsultor(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("atividades_consultor")
      .select(
        "id, tipo, descricao, status, data_vencimento, created_at, empresa:empresas_perfil(id, nome_empresa), candidatura:candidaturas(id, edital:editais(titulo))",
      )
      .eq("consultor_id", consultor.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const criarAtividade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      empresaId: string;
      candidaturaId?: string | null;
      tipo: string;
      descricao?: string | null;
      dataVencimento?: string | null;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const consultor = await assertConsultor(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("atividades_consultor")
      .insert({
        consultor_id: consultor.id,
        empresa_id: data.empresaId,
        candidatura_id: data.candidaturaId ?? null,
        tipo: data.tipo,
        descricao: data.descricao ?? null,
        data_vencimento: data.dataVencimento ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const concluirAtividade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const consultor = await assertConsultor(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("atividades_consultor")
      .update({ status: "concluida" })
      .eq("id", data.id)
      .eq("consultor_id", consultor.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Chamada pelo cliente (portal) — cria um chamado vinculado ao consultor já
// associado à empresa, ou pendente de atribuição se ainda não houver um.
export const chamarConsultor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { candidaturaId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: cand, error: ce } = await context.supabase
      .from("candidaturas")
      .select("id, edital:editais(titulo)")
      .eq("id", data.candidaturaId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (ce) throw new Error(ce.message);
    if (!cand) throw new Error("candidatura não encontrada");

    const { data: perfil, error: pe } = await context.supabase
      .from("empresas_perfil")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (pe) throw new Error(pe.message);
    if (!perfil) throw new Error("cadastre o perfil da empresa antes de chamar um consultor");

    // Busca o contrato ativo via supabaseAdmin: a empresa não tem (e não
    // precisa de) permissão de leitura em consultor_clientes por RLS.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: contrato } = await supabaseAdmin
      .from("consultor_clientes")
      .select("consultor_id")
      .eq("empresa_id", perfil.id)
      .eq("status", "ativo")
      .maybeSingle();

    const edital = cand.edital as { titulo: string } | null;
    const { error } = await context.supabase.from("atividades_consultor").insert({
      consultor_id: contrato?.consultor_id ?? null,
      empresa_id: perfil.id,
      candidatura_id: data.candidaturaId,
      tipo: "chamado_cliente",
      descricao: `Cliente solicitou apoio na candidatura "${edital?.titulo ?? ""}".`,
      status: "pendente",
    });
    if (error) throw new Error(error.message);

    if (contrato?.consultor_id) {
      await context.supabase
        .from("candidaturas")
        .update({ consultor_id: contrato.consultor_id })
        .eq("id", data.candidaturaId)
        .eq("user_id", context.userId);
    }

    return { ok: true, atribuido: Boolean(contrato?.consultor_id) };
  });
