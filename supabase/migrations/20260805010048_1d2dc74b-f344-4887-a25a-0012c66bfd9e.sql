-- 1) Consultores credenciados (staff interno; nunca auto-cadastro).
CREATE TABLE IF NOT EXISTS public.consultores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  email text NOT NULL,
  telefone text,
  especialidade text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.consultores TO authenticated;
GRANT ALL ON public.consultores TO service_role;

ALTER TABLE public.consultores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consultor_le_proprio_registro" ON public.consultores;
CREATE POLICY "consultor_le_proprio_registro" ON public.consultores
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_consultores_updated_at ON public.consultores;
CREATE TRIGGER trg_consultores_updated_at
  BEFORE UPDATE ON public.consultores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Vínculo consultor <-> empresa cliente (contrato).
CREATE TABLE IF NOT EXISTS public.consultor_clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultor_id uuid NOT NULL REFERENCES public.consultores(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas_perfil(id) ON DELETE CASCADE,
  contrato_inicio date NOT NULL DEFAULT CURRENT_DATE,
  contrato_fim date,
  status text NOT NULL DEFAULT 'ativo',
  creditos_contratados integer NOT NULL DEFAULT 0,
  creditos_utilizados integer NOT NULL DEFAULT 0,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_consultor_cliente_ativo
  ON public.consultor_clientes (consultor_id, empresa_id)
  WHERE status = 'ativo';

CREATE INDEX IF NOT EXISTS idx_consultor_clientes_consultor ON public.consultor_clientes(consultor_id);
CREATE INDEX IF NOT EXISTS idx_consultor_clientes_empresa ON public.consultor_clientes(empresa_id);

GRANT SELECT ON public.consultor_clientes TO authenticated;
GRANT ALL ON public.consultor_clientes TO service_role;

ALTER TABLE public.consultor_clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consultor_ve_proprios_clientes" ON public.consultor_clientes;
CREATE POLICY "consultor_ve_proprios_clientes" ON public.consultor_clientes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.consultores c
      WHERE c.id = consultor_clientes.consultor_id AND c.user_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS trg_consultor_clientes_updated_at ON public.consultor_clientes;
CREATE TRIGGER trg_consultor_clientes_updated_at
  BEFORE UPDATE ON public.consultor_clientes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) Qual consultor acompanha cada candidatura.
ALTER TABLE public.candidaturas
  ADD COLUMN IF NOT EXISTS consultor_id uuid REFERENCES public.consultores(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_candidaturas_consultor ON public.candidaturas(consultor_id);

DROP POLICY IF EXISTS "consultor_ve_candidaturas_dos_clientes" ON public.candidaturas;
CREATE POLICY "consultor_ve_candidaturas_dos_clientes" ON public.candidaturas
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.consultor_clientes cc
      JOIN public.consultores c ON c.id = cc.consultor_id
      JOIN public.empresas_perfil ep ON ep.id = cc.empresa_id
      WHERE c.user_id = auth.uid()
        AND ep.user_id = candidaturas.user_id
        AND cc.status = 'ativo'
    )
  );

DROP POLICY IF EXISTS "consultor_atualiza_candidaturas_dos_clientes" ON public.candidaturas;
CREATE POLICY "consultor_atualiza_candidaturas_dos_clientes" ON public.candidaturas
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.consultor_clientes cc
      JOIN public.consultores c ON c.id = cc.consultor_id
      JOIN public.empresas_perfil ep ON ep.id = cc.empresa_id
      WHERE c.user_id = auth.uid()
        AND ep.user_id = candidaturas.user_id
        AND cc.status = 'ativo'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.consultor_clientes cc
      JOIN public.consultores c ON c.id = cc.consultor_id
      JOIN public.empresas_perfil ep ON ep.id = cc.empresa_id
      WHERE c.user_id = auth.uid()
        AND ep.user_id = candidaturas.user_id
        AND cc.status = 'ativo'
    )
  );

DROP POLICY IF EXISTS "consultor_ve_empresas_clientes" ON public.empresas_perfil;
CREATE POLICY "consultor_ve_empresas_clientes" ON public.empresas_perfil
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.consultor_clientes cc
      JOIN public.consultores c ON c.id = cc.consultor_id
      WHERE c.user_id = auth.uid()
        AND cc.empresa_id = empresas_perfil.id
        AND cc.status = 'ativo'
    )
  );

DROP POLICY IF EXISTS "consultor_ve_projetos_clientes" ON public.projetos;
CREATE POLICY "consultor_ve_projetos_clientes" ON public.projetos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.consultor_clientes cc
      JOIN public.consultores c ON c.id = cc.consultor_id
      JOIN public.empresas_perfil ep ON ep.id = cc.empresa_id
      WHERE c.user_id = auth.uid()
        AND ep.user_id = projetos.user_id
        AND cc.status = 'ativo'
    )
  );

DROP POLICY IF EXISTS "empresa_ve_consultor_responsavel" ON public.consultores;
CREATE POLICY "empresa_ve_consultor_responsavel" ON public.consultores
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.consultor_clientes cc
      JOIN public.empresas_perfil ep ON ep.id = cc.empresa_id
      WHERE cc.consultor_id = consultores.id
        AND ep.user_id = auth.uid()
        AND cc.status = 'ativo'
    )
  );

-- 4) Atividades do consultor (chamados de cliente + tarefas proprias).
CREATE TABLE IF NOT EXISTS public.atividades_consultor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultor_id uuid REFERENCES public.consultores(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas_perfil(id) ON DELETE CASCADE,
  candidatura_id uuid REFERENCES public.candidaturas(id) ON DELETE SET NULL,
  tipo text NOT NULL,
  descricao text,
  status text NOT NULL DEFAULT 'pendente',
  data_vencimento date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_atividades_consultor_consultor ON public.atividades_consultor(consultor_id);
CREATE INDEX IF NOT EXISTS idx_atividades_consultor_empresa ON public.atividades_consultor(empresa_id);
CREATE INDEX IF NOT EXISTS idx_atividades_consultor_status ON public.atividades_consultor(status);

GRANT SELECT, INSERT, UPDATE ON public.atividades_consultor TO authenticated;
GRANT ALL ON public.atividades_consultor TO service_role;

ALTER TABLE public.atividades_consultor ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consultor_ve_proprias_atividades" ON public.atividades_consultor;
CREATE POLICY "consultor_ve_proprias_atividades" ON public.atividades_consultor
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.consultores c
      WHERE c.id = atividades_consultor.consultor_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "consultor_cria_atividade" ON public.atividades_consultor;
CREATE POLICY "consultor_cria_atividade" ON public.atividades_consultor
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.consultores c
      WHERE c.id = atividades_consultor.consultor_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "consultor_atualiza_propria_atividade" ON public.atividades_consultor;
CREATE POLICY "consultor_atualiza_propria_atividade" ON public.atividades_consultor
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.consultores c
      WHERE c.id = atividades_consultor.consultor_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.consultores c
      WHERE c.id = atividades_consultor.consultor_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "empresa_cria_chamado" ON public.atividades_consultor;
CREATE POLICY "empresa_cria_chamado" ON public.atividades_consultor
  FOR INSERT TO authenticated
  WITH CHECK (
    tipo = 'chamado_cliente'
    AND EXISTS (
      SELECT 1 FROM public.empresas_perfil ep
      WHERE ep.id = atividades_consultor.empresa_id AND ep.user_id = auth.uid()
    )
    AND (
      candidatura_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.candidaturas cd
        WHERE cd.id = atividades_consultor.candidatura_id AND cd.user_id = auth.uid()
      )
    )
  );

DROP TRIGGER IF EXISTS trg_atividades_consultor_updated_at ON public.atividades_consultor;
CREATE TRIGGER trg_atividades_consultor_updated_at
  BEFORE UPDATE ON public.atividades_consultor
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5) Credenciamento de consultor (admin) — vincula usuario ja existente.
CREATE OR REPLACE FUNCTION public.credenciar_consultor(
  _alvo uuid,
  _nome text,
  _email text,
  _telefone text DEFAULT NULL,
  _especialidade text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE eu uuid; novo_id uuid;
BEGIN
  eu := auth.uid();
  IF eu IS NULL THEN RAISE EXCEPTION 'não autenticado'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = eu AND role IN ('SUPER_ADMIN','ADMIN')) THEN
    RAISE EXCEPTION 'somente admin';
  END IF;

  DELETE FROM public.user_roles
    WHERE user_id = _alvo AND role IN ('SUPER_ADMIN','ADMIN','user','CONSULTOR');
  INSERT INTO public.user_roles(user_id, role) VALUES (_alvo, 'CONSULTOR');

  INSERT INTO public.consultores(user_id, nome, email, telefone, especialidade)
  VALUES (_alvo, _nome, _email, _telefone, _especialidade)
  ON CONFLICT (user_id) DO UPDATE SET
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    telefone = EXCLUDED.telefone,
    especialidade = EXCLUDED.especialidade,
    ativo = true,
    updated_at = now()
  RETURNING id INTO novo_id;

  RETURN novo_id;
END $$;

REVOKE ALL ON FUNCTION public.credenciar_consultor(uuid, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.credenciar_consultor(uuid, text, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.credenciar_consultor(uuid, text, text, text, text) TO authenticated;