CREATE OR REPLACE FUNCTION public.consultor_atende_empresa(_empresa_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.consultor_clientes cc
    JOIN public.consultores c ON c.id = cc.consultor_id
    WHERE c.user_id = auth.uid() AND cc.empresa_id = _empresa_id AND cc.status = 'ativo'
  );
$$;

CREATE OR REPLACE FUNCTION public.consultor_atende_user(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.consultor_clientes cc
    JOIN public.consultores c ON c.id = cc.consultor_id
    JOIN public.empresas_perfil ep ON ep.id = cc.empresa_id
    WHERE c.user_id = auth.uid() AND ep.user_id = _user_id AND cc.status = 'ativo'
  );
$$;

CREATE OR REPLACE FUNCTION public.empresa_e_cliente_do_consultor(_consultor_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.consultor_clientes cc
    JOIN public.empresas_perfil ep ON ep.id = cc.empresa_id
    WHERE cc.consultor_id = _consultor_id AND ep.user_id = auth.uid() AND cc.status = 'ativo'
  );
$$;

DROP POLICY IF EXISTS "consultor_ve_empresas_clientes" ON public.empresas_perfil;
CREATE POLICY "consultor_ve_empresas_clientes" ON public.empresas_perfil
  FOR SELECT TO authenticated
  USING (public.consultor_atende_empresa(empresas_perfil.id));

DROP POLICY IF EXISTS "consultor_ve_projetos_clientes" ON public.projetos;
CREATE POLICY "consultor_ve_projetos_clientes" ON public.projetos
  FOR SELECT TO authenticated
  USING (public.consultor_atende_user(projetos.user_id));

DROP POLICY IF EXISTS "consultor_ve_candidaturas_dos_clientes" ON public.candidaturas;
CREATE POLICY "consultor_ve_candidaturas_dos_clientes" ON public.candidaturas
  FOR SELECT TO authenticated
  USING (public.consultor_atende_user(candidaturas.user_id));

DROP POLICY IF EXISTS "consultor_atualiza_candidaturas_dos_clientes" ON public.candidaturas;
CREATE POLICY "consultor_atualiza_candidaturas_dos_clientes" ON public.candidaturas
  FOR UPDATE TO authenticated
  USING (public.consultor_atende_user(candidaturas.user_id))
  WITH CHECK (public.consultor_atende_user(candidaturas.user_id));

DROP POLICY IF EXISTS "empresa_ve_consultor_responsavel" ON public.consultores;
CREATE POLICY "empresa_ve_consultor_responsavel" ON public.consultores
  FOR SELECT TO authenticated
  USING (public.empresa_e_cliente_do_consultor(consultores.id));