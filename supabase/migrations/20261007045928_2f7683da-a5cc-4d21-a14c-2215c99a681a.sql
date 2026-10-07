ALTER TABLE public.consultores ADD COLUMN IF NOT EXISTS bio text, ADD COLUMN IF NOT EXISTS links text[] NOT NULL DEFAULT '{}';

CREATE OR REPLACE FUNCTION public.atualizar_meu_perfil_consultor(_nome text, _telefone text, _especialidade text, _bio text, _links text[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'não autenticado'; END IF;
  IF coalesce(trim(_nome),'') = '' THEN RAISE EXCEPTION 'nome obrigatório'; END IF;
  UPDATE public.consultores SET nome = left(trim(_nome),120), telefone = left(_telefone,40),
    especialidade = left(_especialidade,500), bio = left(_bio,2000), links = coalesce(_links[1:5],'{}')
  WHERE user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'consultor não encontrado'; END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.atualizar_meu_perfil_consultor(text,text,text,text,text[]) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.atualizar_meu_perfil_consultor(text,text,text,text,text[]) TO authenticated;