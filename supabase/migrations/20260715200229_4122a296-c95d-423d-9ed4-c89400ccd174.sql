
-- Bloco 4: proposta IA + preferências de notificação

ALTER TABLE public.candidaturas
  ADD COLUMN IF NOT EXISTS proposta_md text,
  ADD COLUMN IF NOT EXISTS proposta_gerada_em timestamptz;

CREATE TABLE IF NOT EXISTS public.notif_preferencias (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  alertas_prazo boolean NOT NULL DEFAULT true,
  alertas_novos_editais boolean NOT NULL DEFAULT false,
  min_score integer NOT NULL DEFAULT 70,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notif_preferencias TO authenticated;
GRANT ALL ON public.notif_preferencias TO service_role;

ALTER TABLE public.notif_preferencias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_prefs_own" ON public.notif_preferencias;
CREATE POLICY "notif_prefs_own" ON public.notif_preferencias
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_notif_prefs_upd ON public.notif_preferencias;
CREATE TRIGGER trg_notif_prefs_upd
  BEFORE UPDATE ON public.notif_preferencias
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.notif_enviadas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  ref_id text NOT NULL,
  enviado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tipo, ref_id)
);

GRANT SELECT ON public.notif_enviadas TO authenticated;
GRANT ALL ON public.notif_enviadas TO service_role;

ALTER TABLE public.notif_enviadas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_enviadas_own_read" ON public.notif_enviadas;
CREATE POLICY "notif_enviadas_own_read" ON public.notif_enviadas
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notif_enviadas_user_dia
  ON public.notif_enviadas(user_id, enviado_em);
