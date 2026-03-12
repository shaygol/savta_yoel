
CREATE OR REPLACE FUNCTION public.get_user_phone(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT phone FROM public.profiles
  WHERE user_id = _user_id
    AND _user_id = auth.uid()
  LIMIT 1;
$$;
