create table if not exists public.dispatch_batches (
  id uuid primary key default gen_random_uuid(),
  dispatch_batch_id text not null unique,
  dispatch_date date not null,
  hub_code text not null,
  township text,
  zone_code text,
  rider_name text,
  rider_phone text,
  vehicle_no text,
  status text not null default 'PLANNED',
  total_ways integer not null default 0,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.dispatch_batches
  drop constraint if exists dispatch_batches_status_check;

alter table if exists public.dispatch_batches
  add constraint dispatch_batches_status_check
  check (status in ('PLANNED','DISPATCHED','CLOSED','CANCELLED'));

create table if not exists public.dispatch_batch_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.dispatch_batches(id) on delete cascade,
  dispatch_batch_id text not null,
  delivery_id text not null,
  pickup_id text,
  township text,
  rider_name text,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_dispatch_batch_items_unique
on public.dispatch_batch_items(batch_id, delivery_id);

create index if not exists idx_dispatch_batch_items_dispatch_batch_id
on public.dispatch_batch_items(dispatch_batch_id);
