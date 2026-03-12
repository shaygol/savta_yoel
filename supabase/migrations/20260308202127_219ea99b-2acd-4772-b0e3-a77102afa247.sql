
CREATE OR REPLACE FUNCTION public.enforce_order_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  computed_total numeric := 0;
  item jsonb;
  product_price numeric;
BEGIN
  -- Force safe defaults for status fields
  NEW.status := 'pending';
  NEW.payment_status := 'unpaid';

  -- Recompute total_amount from actual product prices
  IF NEW.items IS NOT NULL AND jsonb_array_length(NEW.items) > 0 THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      SELECT price INTO product_price
      FROM public.products
      WHERE id = (item->>'id')::uuid AND available = true;

      IF product_price IS NOT NULL THEN
        computed_total := computed_total + (product_price * COALESCE((item->>'quantity')::int, 1));
      END IF;
    END LOOP;
  END IF;

  NEW.total_amount := computed_total;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_order_defaults_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.enforce_order_defaults();
