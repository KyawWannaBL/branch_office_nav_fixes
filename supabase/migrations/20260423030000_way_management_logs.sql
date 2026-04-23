create table if not exists public.way_status_logs (
  id uuid primary key default gen_random_uuid(),
  delivery_id text not null,
  pickup_id text,
  action text not null,
  from_status text,
  to_status text,
  rider_name text,
  rider_phone text,
  note text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_way_status_logs_delivery_id
on public.way_status_logs(delivery_id);

create index if not exists idx_way_status_logs_pickup_id
on public.way_status_logs(pickup_id);

create table if not exists public.way_print_logs (
  id uuid primary key default gen_random_uuid(),
  delivery_id text not null,
  pickup_id text,
  print_type text not null,
  printed_by text,
  created_at timestamptz not null default now()
);

create index if not exists idx_way_print_logs_delivery_id
on public.way_print_logs(delivery_id);
