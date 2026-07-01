
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE public.fontes_monitoradas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  nome text NOT NULL,
  url_base text NOT NULL,
  tipo_coleta text NOT NULL DEFAULT 'html',
  ativo boolean NOT NULL DEFAULT true,
  frequencia_horas integer NOT NULL DEFAULT 6,
  ultimo_sucesso_em timestamptz,
  ultimo_erro_em timestamptz,
  status_coleta text NOT NULL DEFAULT 'ok',
  ultima_mensagem text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.fontes_monitoradas TO anon, authenticated;
GRANT ALL ON public.fontes_monitoradas TO service_role;
ALTER TABLE public.fontes_monitoradas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Fontes públicas para leitura" ON public.fontes_monitoradas FOR SELECT USING (true);

CREATE TABLE public.editais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  slug text NOT NULL UNIQUE,
  fonte text NOT NULL,
  fonte_id uuid REFERENCES public.fontes_monitoradas(id) ON DELETE SET NULL,
  fonte_tipo text,
  url_original text NOT NULL,
  url_canonica text NOT NULL,
  descricao_curta text,
  descricao_completa text,
  data_publicacao date,
  data_abertura date,
  data_encerramento date,
  status text NOT NULL DEFAULT 'sem_prazo',
  publico_alvo text[],
  elegibilidade text,
  abrangencia text,
  uf text,
  tema text[],
  subtipo_tema text[],
  tipo_apoio text,
  valor_apoio_min numeric,
  valor_apoio_max numeric,
  moeda text NOT NULL DEFAULT 'BRL',
  documentos_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  hash_conteudo text NOT NULL,
  confianca_extracao numeric NOT NULL DEFAULT 0.4,
  precisa_revisao boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  oculto boolean NOT NULL DEFAULT false,
  coletado_em timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (fonte, url_canonica)
);
CREATE INDEX editais_fonte_idx ON public.editais (fonte);
CREATE INDEX editais_status_idx ON public.editais (status);
CREATE INDEX editais_data_encerramento_idx ON public.editais (data_encerramento);
CREATE INDEX editais_ativo_idx ON public.editais (ativo) WHERE ativo = true;
CREATE INDEX editais_titulo_trgm_idx ON public.editais USING gin (titulo gin_trgm_ops);

GRANT SELECT ON public.editais TO anon, authenticated;
GRANT ALL ON public.editais TO service_role;
ALTER TABLE public.editais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Editais ativos são públicos" ON public.editais FOR SELECT USING (ativo = true AND oculto = false);

CREATE TABLE public.editais_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edital_id uuid NOT NULL REFERENCES public.editais(id) ON DELETE CASCADE,
  hash_conteudo text NOT NULL,
  snapshot jsonb NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX editais_historico_edital_idx ON public.editais_historico (edital_id, criado_em DESC);
GRANT SELECT ON public.editais_historico TO anon, authenticated;
GRANT ALL ON public.editais_historico TO service_role;
ALTER TABLE public.editais_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Histórico público" ON public.editais_historico FOR SELECT USING (true);

CREATE TABLE public.logs_coleta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fonte_id uuid REFERENCES public.fontes_monitoradas(id) ON DELETE SET NULL,
  fonte_slug text NOT NULL,
  iniciado_em timestamptz NOT NULL DEFAULT now(),
  finalizado_em timestamptz,
  status text NOT NULL DEFAULT 'em_execucao',
  total_itens_lidos integer NOT NULL DEFAULT 0,
  total_novos integer NOT NULL DEFAULT 0,
  total_atualizados integer NOT NULL DEFAULT 0,
  total_ignorados integer NOT NULL DEFAULT 0,
  mensagem text,
  detalhes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX logs_coleta_fonte_idx ON public.logs_coleta (fonte_slug, iniciado_em DESC);
GRANT SELECT ON public.logs_coleta TO anon, authenticated;
GRANT ALL ON public.logs_coleta TO service_role;
ALTER TABLE public.logs_coleta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Logs públicos" ON public.logs_coleta FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER fontes_updated_at BEFORE UPDATE ON public.fontes_monitoradas
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER editais_updated_at BEFORE UPDATE ON public.editais
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.fontes_monitoradas (slug, nome, url_base, tipo_coleta, ativo, frequencia_horas) VALUES
  ('cnpq',   'CNPq',   'https://www.gov.br/cnpq/pt-br/assuntos/chamadas-publicas/chamadas-abertas', 'dynamic', true, 6),
  ('finep',  'FINEP',  'https://www.finep.gov.br/chamadas-publicas', 'dynamic', true, 6),
  ('sebrae', 'SEBRAE', 'https://observatorio.sebraestartups.com.br/oportunidades', 'dynamic', true, 6),
  ('bndes',  'BNDES',  'https://www.bndes.gov.br/wps/portal/site/home/onde-atuamos/inovacao', 'dynamic', true, 12)
ON CONFLICT (slug) DO NOTHING;
