
-- Function to get the current user's phone from their profile
CREATE OR REPLACE FUNCTION public.get_user_phone(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT phone FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

-- Allow authenticated users to view their own orders (matched by phone)
CREATE POLICY "Users can view own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (customer_phone = public.get_user_phone(auth.uid()));
