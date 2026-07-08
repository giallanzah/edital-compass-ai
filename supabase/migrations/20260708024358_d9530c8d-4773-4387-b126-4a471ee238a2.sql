
-- Restringe has_role
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- Bootstrap: primeiro usuário logado vira SUPER_ADMIN se ninguém for admin ainda
CREATE OR REPLACE FUNCTION public.bootstrap_admin()
RETURNS public.app_role
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE existe boolean; uid uuid;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN RAISE EXCEPTION 'não autenticado'; END IF;
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE role IN ('SUPER_ADMIN','ADMIN')) INTO existe;
  IF existe THEN RETURN NULL; END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (uid, 'SUPER_ADMIN')
    ON CONFLICT (user_id, role) DO NOTHING;
  RETURN 'SUPER_ADMIN'::public.app_role;
END $$;

REVOKE ALL ON FUNCTION public.bootstrap_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bootstrap_admin() TO authenticated;

-- Admin promove ou rebaixa outro usuário
CREATE OR REPLACE FUNCTION public.promover_usuario(_alvo uuid, _role public.app_role)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE eu uuid;
BEGIN
  eu := auth.uid();
  IF eu IS NULL THEN RAISE EXCEPTION 'não autenticado'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = eu AND role IN ('SUPER_ADMIN','ADMIN')) THEN
    RAISE EXCEPTION 'somente admin';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _alvo AND role IN ('SUPER_ADMIN','ADMIN','user');
  INSERT INTO public.user_roles(user_id, role) VALUES (_alvo, _role);
END $$;

REVOKE ALL ON FUNCTION public.promover_usuario(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promover_usuario(uuid, public.app_role) TO authenticated;
