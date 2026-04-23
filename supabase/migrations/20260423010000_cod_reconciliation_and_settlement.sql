alter table if exists public.delivery_orders
  add column if not exists cod_collected_amount numeric not null default 0,
  add column if not exists cod_collected_at timestamptz,
  add column if not exists cod_collected_by text,
  add column if not exists cod_status text not null default 'PENDING',
  add column if not exists settlement_batch_id text,
  add column if not exists settlement_status text not null default 'UNSETTLED',
  add column if not exists settlement_note text;

alter table if exists public.delivery_orders
  drop constraint if exists delivery_orders_cod_status_check;

alter table if exists public.delivery_orders
  add constraint delivery_orders_cod_status_check
  check (cod_status in ('PENDING','COLLECTED','PARTIAL','NOT_APPLICABLE'));

alter table if exists public.delivery_orders
  drop constraint if exists delivery_orders_settlement_status_check;

alter table if exists public.delivery_orders
  add constraint delivery_orders_settlement_status_check
  check (settlement_status in ('UNSETTLED','PARTIAL','SETTLED','DISCREPANCY'));

create table if not exists public.cod_settlement_batches (
  id uuid primary key default gen_random_uuid(),
  settlement_batch_id text not null unique,
  settlement_date date not null,
  hub_code text not null,
  rider_name text,
  rider_phone text,
  total_delivery_count integer not null default 0,
  expected_amount numeric not null default 0,
  collected_amount numeric not null default 0,
  shortage_amount numeric not null default 0,
  overage_amount numeric not null default 0,
  status text not null default 'OPEN',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.cod_settlement_batches
  drop constraint if exists cod_settlement_batches_status_check;

alter table if exists public.cod_settlement_batches
  add constraint cod_settlement_batches_status_check
  check (status in ('OPEN','POSTED','CLOSED','CANCELLED'));

create table if not exists public.cod_settlement_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.cod_settlement_batches(id) on delete cascade,
  settlement_batch_id text not null,
  delivery_id text not null,
  pickup_id text,
  rider_name text,
  expected_amount numeric not null default 0,
  collected_amount numeric not null default 0,
  difference_amount numeric not null default 0,
  status text not null default 'UNSETTLED',
  note text,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_cod_settlement_items_unique
on public.cod_settlement_items(batch_id, delivery_id);

create index if not exists idx_cod_settlement_items_batch
on public.cod_settlement_items(settlement_batch_id);

create table if not exists public.cod_settlement_logs (
  id uuid primary key default gen_random_uuid(),
  settlement_batch_id text,
  delivery_id text,
  action text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_cod_settlement_logs_batch
on public.cod_settlement_logs(settlement_batch_id);

create index if not exists idx_cod_settlement_logs_delivery
on public.cod_settlement_logs(delivery_id);
