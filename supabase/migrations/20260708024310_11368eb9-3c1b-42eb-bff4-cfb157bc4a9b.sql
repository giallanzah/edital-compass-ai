
-- Bloco 2: IA, tarefas de candidatura, roles admin

-- 1) Colunas de cache de IA em editais
ALTER TABLE public.editais
  ADD COLUMN IF NOT EXISTS resumo_ia jsonb,
  ADD COLUMN IF NOT EXISTS requisitos_ia jsonb,
  ADD COLUMN IF NOT EXISTS ia_hash text;

-- 2) Tarefas de candidatura (checklist)
CREATE TABLE IF NOT EXISTS public.candidatura_tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidatura_id uuid NOT NULL REFERENCES public.candidaturas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  titulo text NOT NULL,
  feito boolean NOT NULL DEFAULT false,
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidatura_tarefas TO authenticated;
GRANT ALL ON public.candidatura_tarefas TO service_role;

ALTER TABLE public.candidatura_tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tarefas próprias" ON public.candidatura_tarefas
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tarefas_candidatura ON public.candidatura_tarefas(candidatura_id);

DROP TRIGGER IF EXISTS trg_tarefas_updated_at ON public.candidatura_tarefas;
CREATE TRIGGER trg_tarefas_updated_at
  BEFORE UPDATE ON public.candidatura_tarefas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) Roles admin (padrão seguro: enum + tabela + has_role)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('SUPER_ADMIN','ADMIN','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leitura própria de role" ON public.user_roles;
CREATE POLICY "leitura própria de role" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- 4) Trigger updated_at em candidaturas (caso não exista)
DROP TRIGGER IF EXISTS trg_candidaturas_updated_at ON public.candidaturas;
CREATE TRIGGER trg_candidaturas_updated_at
  BEFORE UPDATE ON public.candidaturas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5) Garantir campo observacoes em candidaturas
ALTER TABLE public.candidaturas
  ADD COLUMN IF NOT EXISTS observacoes text;
