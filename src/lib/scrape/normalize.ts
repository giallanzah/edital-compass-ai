// Pure helpers usados pelo robô e pelo backend. Sem dependências server-only.

export type FonteSlug = "cnpq" | "finep" | "sebrae" | "bndes";

export const FONTE_NOME: Record<FonteSlug, string> = {
  cnpq: "CNPq",
  finep: "FINEP",
  sebrae: "SEBRAE",
  bndes: "BNDES",
};

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export function normalizeUrl(url: string, base?: string): string {
  try {
    const u = new URL(url, base);
    u.hash = "";
    // remove tracking params
    const drop = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
    drop.forEach((k) => u.searchParams.delete(k));
    return u.toString();
  } catch {
    return url;
  }
}

export function parseDateBR(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  // ISO already
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  // dd/mm/yyyy
  const br = /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/.exec(trimmed);
  if (br) {
    const d = br[1].padStart(2, "0");
    const m = br[2].padStart(2, "0");
    let y = br[3];
    if (y.length === 2) y = `20${y}`;
    return `${y}-${m}-${d}`;
  }
  // "12 de junho de 2026"
  const meses: Record<string, string> = {
    janeiro: "01", fevereiro: "02", marco: "03", "março": "03", abril: "04",
    maio: "05", junho: "06", julho: "07", agosto: "08", setembro: "09",
    outubro: "10", novembro: "11", dezembro: "12",
  };
  const long = /(\d{1,2})\s+de\s+([a-zç]+)\s+de\s+(\d{4})/i.exec(trimmed);
  if (long) {
    const m = meses[long[2].toLowerCase()];
    if (m) return `${long[3]}-${m}-${long[1].padStart(2, "0")}`;
  }
  return null;
}

export function computeStatus(params: {
  data_abertura: string | null;
  data_encerramento: string | null;
}): "aberto" | "abre_em_breve" | "encerrando_em_breve" | "encerrado" | "sem_prazo" {
  const now = new Date();
  const abre = params.data_abertura ? new Date(params.data_abertura) : null;
  const enc = params.data_encerramento ? new Date(params.data_encerramento) : null;
  if (!abre && !enc) return "sem_prazo";
  if (enc && enc.getTime() < now.getTime()) return "encerrado";
  if (abre && abre.getTime() > now.getTime()) return "abre_em_breve";
  if (enc) {
    const diasRestantes = Math.ceil((enc.getTime() - now.getTime()) / 86_400_000);
    if (diasRestantes <= 15) return "encerrando_em_breve";
  }
  return "aberto";
}

export function classifyTipoApoio(text: string): string {
  const t = text.toLowerCase();
  if (/subven[çc][ãa]o/.test(t)) return "subvencao";
  if (/incentivo fiscal|lei do bem|dedu[çc][ãa]o/.test(t)) return "incentivo_fiscal";
  if (/bolsa/.test(t)) return "bolsa";
  if (/cr[eé]dito|financiamento|empr[eé]stimo/.test(t)) return "credito";
  if (/equity|participa[çc][ãa]o acion[áa]ria|capital semente/.test(t)) return "equity";
  if (/pr[eê]mio|premia[çc][ãa]o/.test(t)) return "premiacao";
  if (/incuba[çc][ãa]o|acelera[çc][ãa]o/.test(t)) return "incubacao";
  return "outro";
}

export function classifyPublico(text: string): string[] {
  const t = text.toLowerCase();
  const out = new Set<string>();
  if (/startup/.test(t)) out.add("startup");
  if (/pme|pequena empresa|micro empresa|mpe|epp/.test(t)) out.add("pme");
  if (/ict|instituto|universidade|centro de pesquisa/.test(t)) out.add("ict");
  if (/pesquisador|bolsista|doutor/.test(t)) out.add("pesquisador");
  if (/empresa|ind[uú]stria/.test(t)) out.add("empresa");
  if (/incubadora|acelerador/.test(t)) out.add("incubadora");
  return [...out];
}

export function classifyTemas(text: string): string[] {
  const t = text.toLowerCase();
  const out = new Set<string>();
  if (/pd&i|p&d|pesquisa|desenvolvimento e inova[çc][ãa]o/.test(t)) out.add("PD&I");
  if (/sa[uú]de|healthtech|biotec/.test(t)) out.add("Saúde");
  if (/energia|renov[áa]vel|solar|e[óo]lica/.test(t)) out.add("Energia");
  if (/sustentabilidade|clima|carbono|verde|ambiental/.test(t)) out.add("Sustentabilidade");
  if (/ind[uú]stria 4|manufatura|automa[çc][ãa]o/.test(t)) out.add("Indústria 4.0");
  if (/agro|agroneg[óo]cio|agricultura/.test(t)) out.add("Agronegócio");
  if (/intelig[eê]ncia artificial|ia|machine learning/.test(t)) out.add("IA");
  if (/educa[çc][ãa]o|edtech/.test(t)) out.add("Educação");
  return [...out];
}

export function extractionConfidence(rec: {
  titulo?: string | null;
  url_original?: string | null;
  descricao_curta?: string | null;
  descricao_completa?: string | null;
  data_encerramento?: string | null;
  data_abertura?: string | null;
  data_publicacao?: string | null;
}): number {
  const hasTitulo = !!rec.titulo && rec.titulo.length > 5;
  const hasLink = !!rec.url_original;
  const hasDesc = !!(rec.descricao_curta || rec.descricao_completa);
  const hasPrazo = !!(rec.data_encerramento || rec.data_abertura || rec.data_publicacao);
  if (!hasTitulo || !hasLink) return 0.2;
  if (hasTitulo && hasLink && hasDesc && hasPrazo) return 1.0;
  if (hasTitulo && hasLink && (hasDesc || hasPrazo)) return 0.7;
  return 0.4;
}

export async function hashContent(...parts: (string | null | undefined)[]): Promise<string> {
  const joined = parts.filter(Boolean).join("|");
  const enc = new TextEncoder().encode(joined);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
