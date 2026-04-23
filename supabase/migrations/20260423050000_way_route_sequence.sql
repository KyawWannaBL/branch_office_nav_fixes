alter table if exists public.delivery_orders
  add column if not exists route_sequence integer;
