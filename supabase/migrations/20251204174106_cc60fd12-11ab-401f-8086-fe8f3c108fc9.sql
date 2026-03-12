-- Fix search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix search_path for update_customer_on_order function
CREATE OR REPLACE FUNCTION public.update_customer_on_order()
RETURNS TRIGGER AS $$
DECLARE
  existing_customer_id UUID;
BEGIN
  SELECT id INTO existing_customer_id FROM public.customers WHERE phone = NEW.customer_phone;
  
  IF existing_customer_id IS NULL THEN
    INSERT INTO public.customers (phone, name, total_orders_count, total_spent_amount, last_order_date)
    VALUES (NEW.customer_phone, NEW.customer_name, 1, NEW.total_amount, now())
    RETURNING id INTO existing_customer_id;
  ELSE
    UPDATE public.customers 
    SET 
      total_orders_count = total_orders_count + 1,
      total_spent_amount = total_spent_amount + NEW.total_amount,
      last_order_date = now(),
      name = NEW.customer_name
    WHERE id = existing_customer_id;
  END IF;
  
  NEW.customer_id = existing_customer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;