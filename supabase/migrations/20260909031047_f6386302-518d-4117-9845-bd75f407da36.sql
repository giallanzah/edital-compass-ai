CREATE TABLE public.solicitacoes_acesso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  perfil text NOT NULL CHECK (perfil IN ('consultor','admin')),
  nome text,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovada','recusada')),
  observacao text,
  decidido_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.solicitacoes_acesso TO authenticated;
GRANT ALL ON public.solicitacoes_acesso TO service_role;

ALTER TABLE public.solicitacoes_acesso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario cria propria solicitacao"
ON public.solicitacoes_acesso FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND status = 'pendente');

CREATE POLICY "usuario le propria solicitacao"
ON public.solicitacoes_acesso FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "admins leem solicitacoes"
ON public.solicitacoes_acesso FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'SUPER_ADMIN'::app_role) OR has_role(auth.uid(), 'ADMIN'::app_role));

CREATE POLICY "admins atualizam solicitacoes"
ON public.solicitacoes_acesso FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'SUPER_ADMIN'::app_role) OR has_role(auth.uid(), 'ADMIN'::app_role))
WITH CHECK (has_role(auth.uid(), 'SUPER_ADMIN'::app_role) OR has_role(auth.uid(), 'ADMIN'::app_role));

CREATE UNIQUE INDEX solicitacoes_acesso_pendente_unica
ON public.solicitacoes_acesso (user_id, perfil)
WHERE status = 'pendente';

CREATE TRIGGER solicitacoes_acesso_set_updated_at
BEFORE UPDATE ON public.solicitacoes_acesso
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();