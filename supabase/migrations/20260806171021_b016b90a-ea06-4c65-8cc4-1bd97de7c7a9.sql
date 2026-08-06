ALTER TABLE public.fontes_monitoradas
  ADD COLUMN IF NOT EXISTS urls_extra text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS categoria text NOT NULL DEFAULT 'federal',
  ADD COLUMN IF NOT EXISTS uf text;