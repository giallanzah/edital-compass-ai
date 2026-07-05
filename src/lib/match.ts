// Heurística de match compartilhada entre server e client (para exibição).
export type EditalParaMatch = {
  status: string;
  tema: string[] | null;
  publico_alvo: string[] | null;
  abrangencia: string | null;
  uf: string | null;
  tipo_apoio: string | null;
};

export type PerfilParaMatch = {
  temas: string[];
  porte: string | null;
  uf: string | null;
  estagio: string | null;
};

export type MatchBreakdown = {
  score: number;
  detalhes: { rotulo: string; ok: boolean; peso: number; nota?: string }[];
};

const PORTE_PARA_PUBLICO: Record<string, string[]> = {
  MEI: ["mei", "microempreendedor", "startup", "pessoa jurídica"],
  ME: ["me", "microempresa", "startup", "pequena empresa", "pessoa jurídica"],
  EPP: ["epp", "pequena empresa", "startup", "pessoa jurídica"],
  Média: ["média empresa", "empresa", "pessoa jurídica"],
  Grande: ["grande empresa", "empresa", "pessoa jurídica"],
  ICT: ["ict", "universidade", "pesquisador", "instituição científica"],
};

export function computeMatchLocal(
  edital: EditalParaMatch,
  perfil: PerfilParaMatch,
): MatchBreakdown {
  const detalhes: MatchBreakdown["detalhes"] = [];
  let score = 0;

  // Tema — 40 pontos
  const temaEdital = (edital.tema ?? []).map((t) => t.toLowerCase());
  const temaPerfil = perfil.temas.map((t) => t.toLowerCase());
  const intersecao = temaPerfil.filter((t) => temaEdital.some((e) => e.includes(t) || t.includes(e)));
  if (temaEdital.length === 0) {
    detalhes.push({ rotulo: "Tema", ok: true, peso: 20, nota: "edital sem tema classificado" });
    score += 20;
  } else if (intersecao.length > 0) {
    detalhes.push({
      rotulo: "Tema",
      ok: true,
      peso: 40,
      nota: intersecao.slice(0, 3).join(", "),
    });
    score += 40;
  } else {
    detalhes.push({
      rotulo: "Tema",
      ok: false,
      peso: 40,
      nota: `exige ${temaEdital.slice(0, 3).join(", ")}`,
    });
  }

  // Público-alvo x porte — 25 pontos
  const publico = (edital.publico_alvo ?? []).map((p) => p.toLowerCase());
  const alvoDoPorte = (perfil.porte ? PORTE_PARA_PUBLICO[perfil.porte] : []) ?? [];
  if (publico.length === 0) {
    detalhes.push({ rotulo: "Porte", ok: true, peso: 12, nota: "sem restrição" });
    score += 12;
  } else if (alvoDoPorte.some((a) => publico.some((p) => p.includes(a)))) {
    detalhes.push({ rotulo: "Porte", ok: true, peso: 25, nota: perfil.porte ?? "" });
    score += 25;
  } else {
    detalhes.push({
      rotulo: "Porte",
      ok: false,
      peso: 25,
      nota: `exige ${publico.slice(0, 2).join(", ")}`,
    });
  }

  // Abrangência — 20 pontos
  const abr = (edital.abrangencia ?? "").toLowerCase();
  const ufE = (edital.uf ?? "").toUpperCase();
  const ufP = (perfil.uf ?? "").toUpperCase();
  if (!abr && !ufE) {
    detalhes.push({ rotulo: "Região", ok: true, peso: 10, nota: "sem restrição" });
    score += 10;
  } else if (abr.includes("nacional") || (ufE && ufP && ufE === ufP)) {
    detalhes.push({
      rotulo: "Região",
      ok: true,
      peso: 20,
      nota: abr.includes("nacional") ? "Nacional" : ufE,
    });
    score += 20;
  } else {
    detalhes.push({
      rotulo: "Região",
      ok: false,
      peso: 20,
      nota: `exige ${ufE || edital.abrangencia}`,
    });
  }

  // Status — 15 pontos
  if (edital.status === "aberto") {
    detalhes.push({ rotulo: "Status", ok: true, peso: 15, nota: "aberto" });
    score += 15;
  } else if (edital.status === "abre_em_breve") {
    detalhes.push({ rotulo: "Status", ok: true, peso: 8, nota: "abre em breve" });
    score += 8;
  } else {
    detalhes.push({ rotulo: "Status", ok: false, peso: 15, nota: edital.status });
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), detalhes };
}
