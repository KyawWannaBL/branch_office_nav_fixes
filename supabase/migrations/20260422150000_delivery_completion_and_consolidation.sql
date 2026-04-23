create extension if not exists pgcrypto;

alter table if exists public.delivery_orders
  add column if not exists parent_pickup_id text,
  add column if not exists delivery_status text not null default 'DRAFT',
  add column if not exists delivered_at timestamptz,
  add column if not exists delivered_by text,
  add column if not exists delivered_receiver_name text,
  add column if not exists delivered_receiver_phone text,
  add column if not exists pod_note text,
  add column if not exists pod_photo_url text,
  add column if not exists consolidated_id text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'delivery_orders_delivery_status_check'
  ) then
    alter table public.delivery_orders
      add constraint delivery_orders_delivery_status_check
      check (delivery_status in ('DRAFT','SAVED','SUBMITTED','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','FAILED','RETURNED','CANCELLED'));
  end if;
end $$;

create table if not exists public.delivery_completion_batches (
  id uuid primary key default gen_random_uuid(),
  delivered_reg_id text not null unique,
  delivery_date date not null,
  hub_code text not null,
  rider_name text,
  vehicle_no text,
  status text not null default 'DRAFT',
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.delivery_completion_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.delivery_completion_batches(id) on delete cascade,
  delivered_reg_id text not null,
  pickup_id text,
  delivery_id text not null,
  receiver_name text,
  receiver_phone text,
  delivered_at timestamptz,
  delivered_by text,
  pod_note text,
  pod_photo_url text,
  status text not null default 'DELIVERED',
  created_at timestamptz not null default now()
);

create table if not exists public.daily_consolidation_batches (
  id uuid primary key default gen_random_uuid(),
  consolidated_id text not null unique,
  consolidation_date date not null,
  hub_code text not null,
  route_code text,
  vehicle_no text,
  driver_name text,
  status text not null default 'OPEN',
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_consolidation_pickups (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.daily_consolidation_batches(id) on delete cascade,
  consolidated_id text not null,
  pickup_id text not null,
  merchant_name text,
  total_way_count integer not null default 0,
  total_weight_kg numeric not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_daily_consolidation_pickups_unique
on public.daily_consolidation_pickups(batch_id, pickup_id);

create index if not exists idx_delivery_completion_items_delivery_id
on public.delivery_completion_items(delivery_id);

create index if not exists idx_daily_consolidation_pickups_pickup_id
on public.daily_consolidation_pickups(pickup_id);
