
-- Log de auditoria real para ações administrativas críticas (substitui o log
-- cosmético em localStorage). Só acessível via service_role — leitura/escrita
-- acontecem exclusivamente pelas server functions do backoffice, que já
-- validam o role do ator antes de chamar.
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text NOT NULL,
  action text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.admin_audit_log TO service_role;

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
-- Nenhuma policy para `authenticated`/`anon`: acesso é negado por padrão com
-- RLS habilitado, e a leitura administrativa passa pelo client de service_role.

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at
  ON public.admin_audit_log (created_at DESC);
