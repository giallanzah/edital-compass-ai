// Server-only. Orquestra: chama Firecrawl por fonte, normaliza,
// dedupe, salva histórico, atualiza fontes/logs.
import Firecrawl from "@mendable/firecrawl-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  FONTE_NOME,
  type FonteSlug,
  slugify,
  normalizeUrl,
  parseDateBR,
  computeStatus,
  classifyTipoApoio,
  classifyPublico,
  classifyTemas,
  extractionConfidence,
  hashContent,
} from "./normalize";

type ExtractedEdital = {
  titulo: string;
  url: string;
  descricao?: string | null;
  data_publicacao?: string | null;
  data_abertura?: string | null;
  data_encerramento?: string | null;
  abrangencia?: string | null;
};

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    editais: {
      type: "array",
      description:
        "Lista de chamadas/editais/oportunidades listados na página. Ignore itens de menu, notícias e conteúdos que não sejam editais.",
      items: {
        type: "object",
        properties: {
          titulo: { type: "string", description: "Título do edital/chamada" },
          url: {
            type: "string",
            description: "URL completa e absoluta para a página de detalhe do edital",
          },
          descricao: {
            type: "string",
            description: "Descrição curta (1-3 frases). Vazio se não houver.",
          },
          data_publicacao: {
            type: "string",
            description: "Data de publicação em ISO YYYY-MM-DD, ou vazio",
          },
          data_abertura: {
            type: "string",
            description: "Início das inscrições em ISO YYYY-MM-DD, ou vazio",
          },
          data_encerramento: {
            type: "string",
            description: "Encerramento das inscrições em ISO YYYY-MM-DD, ou vazio",
          },
          abrangencia: {
            type: "string",
            description: "Abrangência geográfica (Nacional, SP, RJ, etc). Vazio se não houver.",
          },
        },
        required: ["titulo", "url"],
      },
    },
  },
  required: ["editais"],
};

function getFirecrawl(): Firecrawl {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY não configurado.");
  return new Firecrawl({ apiKey });
}

const MAX_TENTATIVAS = 3;
const RETRYABLE_RE = /5\d{2}|timeout|timed?[ _-]?out|ECONN|ETIMEDOUT|network|socket|rate.?limit|429/i;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function extractFromUrl(url: string): Promise<ExtractedEdital[]> {
  const fc = getFirecrawl();
  let lastError: unknown;

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    try {
      const result: unknown = await fc.scrape(url, {
        formats: [
          {
            type: "json",
            schema: EXTRACTION_SCHEMA,
            prompt:
              "Extraia todos os editais, chamadas públicas ou oportunidades de fomento listados. Ignore itens de navegação e notícias.",
          },
        ],
        onlyMainContent: true,
        // Páginas gov.br são pesadas e lentas (CNPq responde 524 via proxy):
        // espera o JS renderizar e dá folga generosa antes de desistir.
        waitFor: 5000,
        timeout: 120000,
      });
      const json =
        (result as { json?: { editais?: ExtractedEdital[] } })?.json ??
        (result as { data?: { json?: { editais?: ExtractedEdital[] } } })?.data?.json;
      return json?.editais ?? [];
    } catch (e) {
      lastError = e;
      const msg = e instanceof Error ? e.message : String(e);
      const retryable = RETRYABLE_RE.test(msg);
      console.warn(
        `[scraper] tentativa ${tentativa}/${MAX_TENTATIVAS} falhou para ${url}: ${msg}${retryable && tentativa < MAX_TENTATIVAS ? " — aguardando retry" : ""}`,
      );
      if (!retryable || tentativa === MAX_TENTATIVAS) throw e;
      await sleep(tentativa * 15000); // backoff: 15s, 30s
    }
  }
  throw lastError;
}

// Página de detalhe: usada para completar prazos que a listagem não traz.
const DETAIL_SCHEMA = {
  type: "object",
  properties: {
    data_publicacao: { type: "string", description: "Data de publicação ISO YYYY-MM-DD ou vazio" },
    data_abertura: { type: "string", description: "Início das inscrições ISO YYYY-MM-DD ou vazio" },
    data_encerramento: {
      type: "string",
      description: "Prazo final de submissão ISO YYYY-MM-DD ou vazio",
    },
    descricao: { type: "string", description: "Resumo do objeto do edital em 1-3 frases" },
    abrangencia: { type: "string", description: "Abrangência geográfica ou vazio" },
  },
};

const MAX_DETALHES_POR_FONTE = 8;

async function enrichFromDetail(url: string): Promise<Partial<ExtractedEdital> | null> {
  try {
    const fc = getFirecrawl();
    const result: unknown = await fc.scrape(url, {
      formats: [
        {
          type: "json",
          schema: DETAIL_SCHEMA,
          prompt:
            "Extraia as datas oficiais (publicação, abertura e encerramento das inscrições) e um resumo curto do objeto deste edital.",
        },
      ],
      onlyMainContent: true,
      waitFor: 3000,
      timeout: 90000,
    });
    const json =
      (result as { json?: Partial<ExtractedEdital> })?.json ??
      (result as { data?: { json?: Partial<ExtractedEdital> } })?.data?.json;
    return json ?? null;
  } catch (e) {
    console.warn(`[scraper] detalhe falhou para ${url}:`, e instanceof Error ? e.message : e);
    return null;
  }
}

export async function runScrape(fonteSlug: FonteSlug | "todas"): Promise<{
  fontes: { slug: string; novos: number; atualizados: number; ignorados: number; status: string; mensagem?: string }[];
}> {
  let alvos: FonteSlug[];
  if (fonteSlug === "todas") {
    // Alvos vêm do banco: novas fontes (FAPs, Lei do Bem) entram sem deploy.
    const { data } = await supabaseAdmin
      .from("fontes_monitoradas")
      .select("slug")
      .eq("ativo", true)
      .order("slug");
    alvos = (data ?? []).map((f) => f.slug as FonteSlug);
  } else {
    alvos = [fonteSlug];
  }
  const results: {
    slug: string;
    novos: number;
    atualizados: number;
    ignorados: number;
    status: string;
    mensagem?: string;
  }[] = [];

  for (const slug of alvos) {
    results.push(await runScrapeFonte(slug));
  }
  return { fontes: results };
}

async function runScrapeFonte(slug: FonteSlug) {
  const { data: fonte } = await supabaseAdmin
    .from("fontes_monitoradas")
    .select("id, slug, nome, url_base, urls_extra, ativo")
    .eq("slug", slug)
    .maybeSingle();


  if (!fonte) {
    return { slug, novos: 0, atualizados: 0, ignorados: 0, status: "fail", mensagem: "Fonte não encontrada" };
  }
  if (!fonte.ativo) {
    return { slug, novos: 0, atualizados: 0, ignorados: 0, status: "warn", mensagem: "Fonte pausada" };
  }

  const { data: logRow } = await supabaseAdmin
    .from("logs_coleta")
    .insert({ fonte_id: fonte.id, fonte_slug: slug, status: "em_execucao" })
    .select("id")
    .single();

  let novos = 0;
  let atualizados = 0;
  let ignorados = 0;
  let status: "ok" | "warn" | "fail" = "ok";
  let mensagem: string | undefined;
  let itens: ExtractedEdital[] = [];

  try {
    itens = await extractFromUrl(fonte.url_base);
    if (itens.length === 0) {
      status = "warn";
      mensagem = "Nenhum edital extraído da página.";
    }

    for (const item of itens) {
      try {
        const upserted = await upsertEdital(slug, fonte.id, item);
        if (upserted === "novo") novos++;
        else if (upserted === "atualizado") atualizados++;
        else ignorados++;
      } catch (e) {
        ignorados++;
        console.error(`[scraper:${slug}] erro em item`, e);
      }
    }
  } catch (e) {
    status = "fail";
    mensagem = e instanceof Error ? e.message : String(e);
    console.error(`[scraper:${slug}] falhou`, e);
  }

  await supabaseAdmin
    .from("logs_coleta")
    .update({
      finalizado_em: new Date().toISOString(),
      status,
      total_itens_lidos: itens.length,
      total_novos: novos,
      total_atualizados: atualizados,
      total_ignorados: ignorados,
      mensagem,
    })
    .eq("id", logRow?.id ?? "");

  await supabaseAdmin
    .from("fontes_monitoradas")
    .update({
      status_coleta: status === "ok" ? "ok" : status === "warn" ? "warn" : "fail",
      ultimo_sucesso_em: status === "ok" ? new Date().toISOString() : undefined,
      ultimo_erro_em: status === "fail" ? new Date().toISOString() : undefined,
      ultima_mensagem: mensagem ?? null,
    })
    .eq("id", fonte.id);

  return { slug, novos, atualizados, ignorados, status, mensagem };
}

async function upsertEdital(
  slug: FonteSlug,
  fonteId: string,
  item: ExtractedEdital,
): Promise<"novo" | "atualizado" | "ignorado"> {
  const titulo = item.titulo?.trim();
  const url = item.url?.trim();
  if (!titulo || !url) return "ignorado";

  const urlCanonica = normalizeUrl(url);
  const descricao = (item.descricao ?? "").trim() || null;
  const dataAbertura = parseDateBR(item.data_abertura);
  const dataEncerramento = parseDateBR(item.data_encerramento);
  const dataPublicacao = parseDateBR(item.data_publicacao);

  const textoBase = `${titulo} ${descricao ?? ""}`;
  const tipo_apoio = classifyTipoApoio(textoBase);
  const publico_alvo = classifyPublico(textoBase);
  const tema = classifyTemas(textoBase);
  const status = computeStatus({
    data_abertura: dataAbertura,
    data_encerramento: dataEncerramento,
  });

  const confianca = extractionConfidence({
    titulo,
    url_original: url,
    descricao_curta: descricao,
    data_encerramento: dataEncerramento,
    data_abertura: dataAbertura,
    data_publicacao: dataPublicacao,
  });

  const hash = await hashContent(
    titulo,
    descricao,
    dataAbertura,
    dataEncerramento,
    item.abrangencia,
  );

  const fonteNome = FONTE_NOME[slug];

  const { data: existing } = await supabaseAdmin
    .from("editais")
    .select("id, hash_conteudo, slug")
    .eq("fonte", fonteNome)
    .eq("url_canonica", urlCanonica)
    .maybeSingle();

  if (existing) {
    if (existing.hash_conteudo === hash) return "ignorado";
    // salva histórico
    const { data: snapshot } = await supabaseAdmin
      .from("editais")
      .select("*")
      .eq("id", existing.id)
      .single();
    if (snapshot) {
      await supabaseAdmin.from("editais_historico").insert({
        edital_id: existing.id,
        hash_conteudo: snapshot.hash_conteudo,
        snapshot,
      });
    }
    await supabaseAdmin
      .from("editais")
      .update({
        titulo,
        descricao_curta: descricao,
        data_publicacao: dataPublicacao,
        data_abertura: dataAbertura,
        data_encerramento: dataEncerramento,
        status,
        abrangencia: item.abrangencia ?? null,
        publico_alvo,
        tema,
        tipo_apoio,
        hash_conteudo: hash,
        confianca_extracao: confianca,
        precisa_revisao: confianca < 0.4,
        coletado_em: new Date().toISOString(),
      })
      .eq("id", existing.id);
    return "atualizado";
  }

  const baseSlug = slugify(`${fonteNome}-${titulo}`);
  const editalSlug = `${baseSlug}-${hash.slice(0, 6)}`;

  const { error: insertError } = await supabaseAdmin.from("editais").insert({
    titulo,
    slug: editalSlug,
    fonte: fonteNome,
    fonte_id: fonteId,
    url_original: url,
    url_canonica: urlCanonica,
    descricao_curta: descricao,
    data_publicacao: dataPublicacao,
    data_abertura: dataAbertura,
    data_encerramento: dataEncerramento,
    status,
    abrangencia: item.abrangencia ?? null,
    publico_alvo,
    tema,
    tipo_apoio,
    hash_conteudo: hash,
    confianca_extracao: confianca,
    precisa_revisao: confianca < 0.4,
  });
  if (insertError) {
    console.error("[upsertEdital] insert error", insertError);
    return "ignorado";
  }
  return "novo";
}
