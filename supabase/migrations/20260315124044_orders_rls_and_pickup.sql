-- Allow customers to view only their own orders by matching phone to their profile
CREATE POLICY "Customers can view own orders"
ON public.orders FOR SELECT
TO authenticated
USING (
  customer_phone = (
    SELECT phone FROM public.profiles
    WHERE user_id = auth.uid()
  )
);

-- Add pickup date and time columns to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pickup_date date,
  ADD COLUMN IF NOT EXISTS pickup_time text;
