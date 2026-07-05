
CREATE TABLE public.empresas_perfil (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_empresa text NOT NULL,
  cnpj text,
  setor text,
  porte text,
  uf text,
  estagio text,
  temas text[] NOT NULL DEFAULT '{}',
  faturamento_faixa text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresas_perfil TO authenticated;
GRANT ALL ON public.empresas_perfil TO service_role;
ALTER TABLE public.empresas_perfil ENABLE ROW LEVEL SECURITY;
CREATE POLICY "empresas_perfil_own" ON public.empresas_perfil
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_empresas_perfil_updated_at BEFORE UPDATE ON public.empresas_perfil
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.projetos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projetos TO authenticated;
GRANT ALL ON public.projetos TO service_role;
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projetos_own" ON public.projetos
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_projetos_updated_at BEFORE UPDATE ON public.projetos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.candidaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  projeto_id uuid NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  edital_id uuid NOT NULL REFERENCES public.editais(id) ON DELETE CASCADE,
  estagio text NOT NULL DEFAULT 'rascunho',
  progresso int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (projeto_id, edital_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidaturas TO authenticated;
GRANT ALL ON public.candidaturas TO service_role;
ALTER TABLE public.candidaturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "candidaturas_own" ON public.candidaturas
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_candidaturas_updated_at BEFORE UPDATE ON public.candidaturas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
