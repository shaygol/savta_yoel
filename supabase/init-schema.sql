-- ==============================================
-- savta_yoel - Full Database Schema
-- Run this in Supabase SQL Editor after creating a new project
-- ==============================================

-- Enum
create type public.app_role as enum ('admin', 'user', 'employee');

-- articles
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text not null,
  url text,
  snippet text,
  image_url text,
  publication_date date,
  display_order integer,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- coupons
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text default 'percentage' not null,
  discount_value numeric not null,
  active boolean default true not null,
  max_uses integer,
  current_uses integer default 0 not null,
  min_order_amount numeric,
  expires_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- customers
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  total_orders_count integer,
  total_spent_amount numeric,
  last_order_date timestamptz,
  product_purchase_history jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- expenses
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  amount numeric not null,
  category text,
  expense_date date default current_date not null,
  receipt_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  customer_id uuid references public.customers(id) on delete set null,
  items jsonb default '[]'::jsonb not null,
  total_amount numeric default 0 not null,
  -- status: pending | confirmed | ready | completed | cancelled
  status text default 'pending' not null,
  -- payment_status: unpaid | paid | refunded
  payment_status text default 'unpaid' not null,
  notes text,
  admin_notes text,
  tray_layout jsonb,
  is_preparation_counted boolean,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- loyalty_points
create table public.loyalty_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  transaction_type text not null,
  points integer default 0 not null,
  description text,
  created_at timestamptz default now() not null
);

-- products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null,
  category text default 'general' not null,
  description text,
  image_url text,
  available boolean default true,
  inventory integer,
  max_quantity_per_order integer,
  display_order integer,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- product_images
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  display_order integer,
  created_at timestamptz default now() not null
);

-- profiles
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  phone text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- reviews
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null,
  comment text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- settings
create table public.settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- user_roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz default now() not null
);

-- ==============================================
-- Functions
-- ==============================================

create or replace function public.get_user_phone(_user_id uuid)
returns text
language sql
security definer
as $$
  select phone from public.profiles where user_id = _user_id limit 1;
$$;

create or replace function public.has_role(_role public.app_role, _user_id uuid)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

create or replace function public.validate_coupon(_code text, _order_amount numeric)
returns table (
  coupon_id uuid,
  discount_type text,
  discount_value numeric,
  valid boolean,
  error_message text
)
language plpgsql
security definer
as $$
declare
  _coupon record;
begin
  select * into _coupon from public.coupons where code = _code and active = true limit 1;

  if not found then
    return query select null::uuid, null::text, null::numeric, false, 'Coupon not found or inactive'::text;
    return;
  end if;

  if _coupon.expires_at is not null and _coupon.expires_at < now() then
    return query select null::uuid, null::text, null::numeric, false, 'Coupon has expired'::text;
    return;
  end if;

  if _coupon.max_uses is not null and _coupon.current_uses >= _coupon.max_uses then
    return query select null::uuid, null::text, null::numeric, false, 'Coupon usage limit reached'::text;
    return;
  end if;

  if _coupon.min_order_amount is not null and _order_amount < _coupon.min_order_amount then
    return query select null::uuid, null::text, null::numeric, false, 'Order amount below minimum'::text;
    return;
  end if;

  return query select _coupon.id, _coupon.discount_type, _coupon.discount_value, true, null::text;
end;
$$;

-- ==============================================
-- Enable RLS on all tables
-- ==============================================

alter table public.articles enable row level security;
alter table public.coupons enable row level security;
alter table public.customers enable row level security;
alter table public.expenses enable row level security;
alter table public.orders enable row level security;
alter table public.loyalty_points enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.profiles enable row level security;
alter table public.reviews enable row level security;
alter table public.settings enable row level security;
alter table public.user_roles enable row level security;

-- Basic read policies (adjust as needed for your security requirements)
create policy "Public read access" on public.articles for select using (true);
create policy "Public read access" on public.products for select using (true);
create policy "Public read access" on public.product_images for select using (true);
create policy "Public read access" on public.reviews for select using (true);
create policy "Public read access" on public.settings for select using (true);
create policy "Public read access" on public.coupons for select using (true);

-- NOTE: Write policies (insert/update/delete) for admin-only tables
-- (orders, customers, products, articles, settings, coupons, expenses)
-- are managed directly in the Supabase dashboard and are not duplicated here.
