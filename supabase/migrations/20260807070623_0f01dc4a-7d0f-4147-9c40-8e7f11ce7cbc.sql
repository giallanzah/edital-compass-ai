-- 1. editais_historico: remover leitura pública
DROP POLICY IF EXISTS "Histórico público" ON public.editais_historico;
REVOKE SELECT ON public.editais_historico FROM anon, authenticated;
GRANT ALL ON public.editais_historico TO service_role;

-- 2. logs_coleta: remover leitura pública
DROP POLICY IF EXISTS "Logs públicos" ON public.logs_coleta;
REVOKE SELECT ON public.logs_coleta FROM anon, authenticated;
GRANT ALL ON public.logs_coleta TO service_role;

-- 3. admin_audit_log: leitura apenas para admins; sem escrita via API
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins leem audit log" ON public.admin_audit_log;
CREATE POLICY "admins leem audit log"
  ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'SUPER_ADMIN') OR public.has_role(auth.uid(), 'ADMIN'));

-- 4. SECURITY DEFINER: revogar execução de anônimos; funções admin só autenticados
REVOKE ALL ON FUNCTION public.bootstrap_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_admin() TO authenticated;

REVOKE ALL ON FUNCTION public.promover_usuario(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promover_usuario(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.credenciar_consultor(uuid, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.credenciar_consultor(uuid, text, text, text, text) TO authenticated;

-- Helpers usados dentro de policies: precisam de EXECUTE para authenticated
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.consultor_atende_empresa(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consultor_atende_empresa(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.consultor_atende_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consultor_atende_user(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.empresa_e_cliente_do_consultor(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.empresa_e_cliente_do_consultor(uuid) TO authenticated, service_role;