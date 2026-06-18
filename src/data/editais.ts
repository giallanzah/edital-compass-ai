export type Edital = {
  id: string;
  title: string;
  agency: "CNPq" | "FINEP" | "SEBRAE" | "BNDES" | "FAPESP" | "FAPERJ" | "FAPEMIG" | "Lei do Bem";
  modality: "Subvenção" | "Crédito" | "Bolsa" | "Incentivo Fiscal" | "Equity";
  area: string[];
  amountMin: number;
  amountMax: number;
  deadline: string; // ISO
  match: number; // 0-100
  status: "Aberto" | "Em breve" | "Encerrado";
  summary: string;
  eligibility: string[];
  updatedAt: string;
};

export const editais: Edital[] = [
  {
    id: "cnpq-universal-2026",
    title: "Chamada Universal CNPq 2026 — Pesquisa científica e tecnológica",
    agency: "CNPq",
    modality: "Subvenção",
    area: ["Ciência", "Tecnologia", "Pesquisa Aplicada"],
    amountMin: 50_000,
    amountMax: 500_000,
    deadline: "2026-08-14",
    match: 94,
    status: "Aberto",
    summary:
      "Apoio a projetos de pesquisa científica, tecnológica e de inovação que contribuam para o avanço do conhecimento em todas as áreas.",
    eligibility: ["Pesquisadores com doutorado", "Vínculo com ICT", "Projeto até 36 meses"],
    updatedAt: "2026-06-12",
  },
  {
    id: "finep-mais-inovacao",
    title: "FINEP Mais Inovação — Crédito para PD&I em empresas",
    agency: "FINEP",
    modality: "Crédito",
    area: ["Indústria 4.0", "Energia", "Saúde"],
    amountMin: 1_000_000,
    amountMax: 200_000_000,
    deadline: "2026-12-20",
    match: 88,
    status: "Aberto",
    summary:
      "Linha de financiamento reembolsável com taxas subsidiadas para projetos de pesquisa, desenvolvimento e inovação de média e alta intensidade tecnológica.",
    eligibility: ["Receita > R$ 16M", "Projeto PD&I formalizado", "Garantias reais"],
    updatedAt: "2026-06-15",
  },
  {
    id: "sebrae-alipme-2026",
    title: "SEBRAE ALI Produção — Agentes Locais de Inovação para PMEs",
    agency: "SEBRAE",
    modality: "Subvenção",
    area: ["PMEs", "Produtividade", "Gestão"],
    amountMin: 20_000,
    amountMax: 80_000,
    deadline: "2026-07-30",
    match: 76,
    status: "Aberto",
    summary:
      "Programa de aceleração com consultoria especializada para implantação de inovação em pequenas e médias empresas industriais.",
    eligibility: ["EPP ou ME", "Atividade produtiva", "CNAE industrial"],
    updatedAt: "2026-06-10",
  },
  {
    id: "bndes-clima",
    title: "BNDES Fundo Clima — Indústria verde e descarbonização",
    agency: "BNDES",
    modality: "Crédito",
    area: ["Sustentabilidade", "Energia limpa", "Indústria"],
    amountMin: 10_000_000,
    amountMax: 500_000_000,
    deadline: "2026-09-30",
    match: 71,
    status: "Aberto",
    summary:
      "Financiamento de longo prazo para projetos de mitigação e adaptação às mudanças climáticas com taxas diferenciadas.",
    eligibility: ["Pessoa jurídica", "Projeto com mensuração de carbono", "Acima de R$ 10M"],
    updatedAt: "2026-06-08",
  },
  {
    id: "fapesp-pipe-fase2",
    title: "FAPESP PIPE Fase 2 — Inovação em pequena empresa",
    agency: "FAPESP",
    modality: "Subvenção",
    area: ["Deep tech", "Biotecnologia", "Software"],
    amountMin: 200_000,
    amountMax: 1_500_000,
    deadline: "2026-07-05",
    match: 91,
    status: "Aberto",
    summary:
      "Financiamento de até R$ 1,5M para PMEs paulistas desenvolverem produtos e processos inovadores com base em pesquisa.",
    eligibility: ["Sede em SP", "Aprovação prévia PIPE Fase 1", "Equipe técnica dedicada"],
    updatedAt: "2026-06-14",
  },
  {
    id: "leidobem-2026",
    title: "Lei do Bem — Incentivos fiscais para PD&I (Exercício 2026)",
    agency: "Lei do Bem",
    modality: "Incentivo Fiscal",
    area: ["P&D", "Todos os setores"],
    amountMin: 0,
    amountMax: 0,
    deadline: "2026-07-31",
    match: 82,
    status: "Aberto",
    summary:
      "Dedução de até 200% dos dispêndios em pesquisa, desenvolvimento e inovação na apuração do IRPJ e CSLL para empresas no Lucro Real.",
    eligibility: ["Lucro Real", "Regularidade fiscal", "Dispêndios comprováveis em PD&I"],
    updatedAt: "2026-06-01",
  },
  {
    id: "faperj-rede",
    title: "FAPERJ Rede Rio de Inovação — Ecossistemas regionais",
    agency: "FAPERJ",
    modality: "Subvenção",
    area: ["Ecossistemas", "Universidades", "Startups"],
    amountMin: 100_000,
    amountMax: 800_000,
    deadline: "2026-08-22",
    match: 64,
    status: "Em breve",
    summary:
      "Apoio à criação e fortalecimento de redes colaborativas entre ICTs, empresas e governo no estado do Rio de Janeiro.",
    eligibility: ["Sede no RJ", "Consórcio ICT + empresa", "Mínimo 2 instituições"],
    updatedAt: "2026-06-13",
  },
  {
    id: "fapemig-startup",
    title: "FAPEMIG Startup Mineira — Capital semente",
    agency: "FAPEMIG",
    modality: "Equity",
    area: ["Startups", "Deep tech"],
    amountMin: 300_000,
    amountMax: 2_000_000,
    deadline: "2026-10-15",
    match: 58,
    status: "Aberto",
    summary:
      "Investimento equity em startups mineiras de base tecnológica com tração inicial e potencial de escala nacional.",
    eligibility: ["Sede em MG", "MVP validado", "CNPJ ativo < 5 anos"],
    updatedAt: "2026-06-09",
  },
];

export const agencies = [
  { name: "CNPq", count: 47, recursos: "R$ 1.8B" },
  { name: "FINEP", count: 32, recursos: "R$ 6.5B" },
  { name: "SEBRAE", count: 54, recursos: "R$ 420M" },
  { name: "BNDES", count: 28, recursos: "R$ 9.2B" },
  { name: "FAPESP", count: 41, recursos: "R$ 850M" },
  { name: "FAPERJ", count: 23, recursos: "R$ 180M" },
  { name: "FAPEMIG", count: 19, recursos: "R$ 140M" },
  { name: "Lei do Bem", count: 1, recursos: "R$ —" },
];

export const myProjects = [
  {
    id: "p1",
    name: "Plataforma de monitoramento ambiental via IoT",
    stage: "Aplicando",
    edital: "FAPESP PIPE Fase 2",
    progress: 65,
    deadline: "2026-07-05",
  },
  {
    id: "p2",
    name: "Sistema preditivo de manutenção industrial",
    stage: "Em revisão",
    edital: "FINEP Mais Inovação",
    progress: 92,
    deadline: "2026-12-20",
  },
  {
    id: "p3",
    name: "Bioplástico a partir de resíduos agrícolas",
    stage: "Rascunho",
    edital: "Chamada Universal CNPq 2026",
    progress: 28,
    deadline: "2026-08-14",
  },
];

export function formatBRL(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}K`;
  return `R$ ${v}`;
}

export function daysUntil(iso: string) {
  const d = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  return d;
}
