// Server functions de IA: resumo, requisitos, aderência.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { aiComplete, tryParseJSON } from "./ai-gateway.server";

const MODEL_FAST = "google/gemini-2.5-flash";
const MODEL_PRO = "google/gemini-2.5-pro";

type ResumoIA = { objetivo: string; publico: string; valor_prazo: string };
type RequisitosIA = { itens: string[] };

async function loadEdital(supabase: ReturnType<typeof supabaseFrom>) {
  return supabase;
}
type _unused = typeof loadEdital;

function contextoDoEdital(e: {
  titulo: string;
  descricao_completa: string | null;
  descricao_curta: string | null;
  publico_alvo: string[] | null;
  tema: string[] | null;
  data_encerramento: string | null;
  fonte: string;
  tipo_apoio: string | null;
}) {
  return [
    `Título: ${e.titulo}`,
    `Fonte: ${e.fonte}`,
    e.tipo_apoio ? `Tipo de apoio: ${e.tipo_apoio}` : "",
    e.data_encerramento ? `Prazo: ${e.data_encerramento}` : "",
    e.publico_alvo?.length ? `Público-alvo: ${e.publico_alvo.join(", ")}` : "",
    e.tema?.length ? `Temas: ${e.tema.join(", ")}` : "",
    `Descrição: ${e.descricao_completa ?? e.descricao_curta ?? ""}`,
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 8000);
}

// Helper para tipagem
function supabaseFrom(x: unknown): unknown {
  return x;
}

export const resumirEdital = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { editalId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: edital } = await context.supabase
      .from("editais")
      .select(
        "id, titulo, descricao_curta, descricao_completa, publico_alvo, tema, data_encerramento, fonte, tipo_apoio, hash_conteudo, resumo_ia, ia_hash",
      )
      .eq("id", data.editalId)
      .maybeSingle();
    if (!edital) throw new Error("edital não encontrado");

    // Cache: se hash bate, retorna
    if (
      edital.resumo_ia &&
      edital.ia_hash === edital.hash_conteudo &&
      edital.hash_conteudo
    ) {
      return edital.resumo_ia as ResumoIA;
    }

    const raw = await aiComplete({
      model: MODEL_FAST,
      json: true,
      system:
        "Você é um analista brasileiro especializado em editais de fomento. Responda SEMPRE em JSON válido com chaves exatamente: objetivo, publico, valor_prazo. Cada valor é um texto curto (máx. 200 caracteres) e objetivo, em português do Brasil.",
      prompt: `Resuma este edital em 3 frases: (1) objetivo, (2) quem pode se candidatar, (3) valor ou prazo relevante.\n\n${contextoDoEdital(edital)}`,
    });
    const parsed = tryParseJSON<ResumoIA>(raw);
    if (!parsed) throw new Error("resposta_ia_invalida");

    // Cachear (usa admin para atualizar campo mesmo sem policy de UPDATE)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("editais")
      .update({ resumo_ia: parsed, ia_hash: edital.hash_conteudo })
      .eq("id", edital.id);
    return parsed;
  });

export const extrairRequisitos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { editalId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: edital } = await context.supabase
      .from("editais")
      .select(
        "id, titulo, descricao_curta, descricao_completa, publico_alvo, tema, data_encerramento, fonte, tipo_apoio, hash_conteudo, requisitos_ia",
      )
      .eq("id", data.editalId)
      .maybeSingle();
    if (!edital) throw new Error("edital não encontrado");

    if (edital.requisitos_ia && Array.isArray((edital.requisitos_ia as RequisitosIA).itens)) {
      return edital.requisitos_ia as RequisitosIA;
    }

    const raw = await aiComplete({
      model: MODEL_FAST,
      json: true,
      system:
        "Você extrai requisitos objetivos de editais de fomento. Responda em JSON válido: {\"itens\": [string, ...]}. Cada item é uma frase curta e verificável (ex.: 'Empresa com CNPJ ativo há 12 meses'). Máx. 10 itens. Português do Brasil.",
      prompt: `Liste os requisitos de elegibilidade e documentação deste edital.\n\n${contextoDoEdital(edital)}`,
    });
    const parsed = tryParseJSON<RequisitosIA>(raw);
    if (!parsed || !Array.isArray(parsed.itens)) throw new Error("resposta_ia_invalida");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("editais")
      .update({ requisitos_ia: parsed })
      .eq("id", edital.id);
    return parsed;
  });

type Aderencia = { score: number; parecer: string; pontos_fortes: string[]; riscos: string[] };

export const analisarAderencia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { editalId: string; projetoId: string }) => input)
  .handler(async ({ data, context }) => {
    const [{ data: edital }, { data: projeto }, { data: perfil }] = await Promise.all([
      context.supabase
        .from("editais")
        .select(
          "titulo, descricao_completa, descricao_curta, publico_alvo, tema, data_encerramento, fonte, tipo_apoio",
        )
        .eq("id", data.editalId)
        .maybeSingle(),
      context.supabase
        .from("projetos")
        .select("nome, descricao")
        .eq("id", data.projetoId)
        .eq("user_id", context.userId)
        .maybeSingle(),
      context.supabase
        .from("empresas_perfil")
        .select("nome_empresa, setor, porte, uf, estagio, temas")
        .eq("user_id", context.userId)
        .maybeSingle(),
    ]);
    if (!edital) throw new Error("edital não encontrado");
    if (!projeto) throw new Error("projeto não encontrado");

    const prompt = `Analise a aderência do projeto/empresa a este edital. Considere: alinhamento temático, porte compatível, região, prazo viável e maturidade do projeto.

EDITAL:
${contextoDoEdital(edital)}

EMPRESA:
${perfil ? `${perfil.nome_empresa} — porte ${perfil.porte}, UF ${perfil.uf}, estágio ${perfil.estagio}, setor ${perfil.setor}, temas: ${(perfil.temas ?? []).join(", ")}` : "sem perfil configurado"}

PROJETO:
${projeto.nome} — ${projeto.descricao ?? "sem descrição"}

Responda em JSON: {"score": 0-100, "parecer": "1-2 parágrafos", "pontos_fortes": ["..."], "riscos": ["..."]}`;

    const raw = await aiComplete({
      model: MODEL_PRO,
      json: true,
      system:
        "Você é um analista brasileiro de fomento. Seja direto, honesto e específico. Português do Brasil. Sempre responda em JSON válido.",
      prompt,
    });
    const parsed = tryParseJSON<Aderencia>(raw);
    if (!parsed) throw new Error("resposta_ia_invalida");
    return parsed;
  });

// -------- Geração de proposta técnica em markdown --------
export const gerarProposta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { candidaturaId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: cand, error: ce } = await context.supabase
      .from("candidaturas")
      .select(
        "id, edital:editais(titulo, descricao_completa, descricao_curta, publico_alvo, tema, data_encerramento, fonte, tipo_apoio, requisitos_ia), projeto:projetos(nome, descricao)",
      )
      .eq("id", data.candidaturaId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (ce) throw new Error(ce.message);
    if (!cand) throw new Error("candidatura não encontrada");

    const edital = cand.edital as Parameters<typeof contextoDoEdital>[0] & {
      requisitos_ia: { itens?: string[] } | null;
    };
    const projeto = cand.projeto as { nome: string; descricao: string | null };

    const { data: perfil } = await context.supabase
      .from("empresas_perfil")
      .select("nome_empresa, setor, porte, uf, estagio, temas, faturamento_faixa")
      .eq("user_id", context.userId)
      .maybeSingle();

    const requisitos = (edital.requisitos_ia?.itens ?? [])
      .map((r, i) => `${i + 1}. ${r}`)
      .join("\n");

    const prompt = `Redija um rascunho de proposta técnica em Markdown para submissão a este edital brasileiro de fomento. Use tom formal, objetivo e específico ao contexto informado. Se algum dado faltar, escreva um marcador entre colchetes (ex.: [preencher orçamento detalhado]).

EDITAL:
${contextoDoEdital(edital)}

${requisitos ? `REQUISITOS DO EDITAL:\n${requisitos}\n` : ""}
EMPRESA PROPONENTE:
${perfil ? `${perfil.nome_empresa} — porte ${perfil.porte ?? "?"}, UF ${perfil.uf ?? "?"}, setor ${perfil.setor ?? "?"}, estágio ${perfil.estagio ?? "?"}, faturamento ${perfil.faturamento_faixa ?? "?"}, temas: ${(perfil.temas ?? []).join(", ") || "—"}` : "sem perfil configurado"}

PROJETO:
${projeto.nome} — ${projeto.descricao ?? "sem descrição adicional"}

Estruture o documento EXATAMENTE com as seções abaixo, nesta ordem, cada uma iniciada por um cabeçalho H2:
## Sumário Executivo
## Aderência ao Edital
## Metodologia
## Cronograma
## Equipe
## Orçamento Indicativo

Retorne apenas o markdown, sem preâmbulo ou explicação.`;

    const raw = await aiComplete({
      model: MODEL_PRO,
      system:
        "Você é um redator brasileiro especialista em propostas de fomento (FINEP, CNPq, BNDES, Sebrae). Escreve em português do Brasil, com precisão e sem clichês. Sempre em Markdown.",
      prompt,
      maxTokens: 3500,
    });
    const md = raw.trim();
    if (!md) throw new Error("resposta_ia_vazia");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("candidaturas")
      .update({ proposta_md: md, proposta_gerada_em: new Date().toISOString() })
      .eq("id", data.candidaturaId)
      .eq("user_id", context.userId);

    return { markdown: md };
  });
