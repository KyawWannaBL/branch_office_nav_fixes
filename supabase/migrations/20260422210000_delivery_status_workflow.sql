alter table if exists public.delivery_orders
  add column if not exists rider_name text,
  add column if not exists rider_phone text,
  add column if not exists rider_assigned_at timestamptz,
  add column if not exists out_for_delivery_at timestamptz,
  add column if not exists failed_attempt_count integer not null default 0,
  add column if not exists failed_attempt_at timestamptz,
  add column if not exists failed_reason text,
  add column if not exists returned_at timestamptz,
  add column if not exists return_reason text,
  add column if not exists pod_status text not null default 'PENDING',
  add column if not exists pod_receiver_name text,
  add column if not exists pod_receiver_phone text,
  add column if not exists pod_signature_url text,
  add column if not exists pod_photo_url text,
  add column if not exists pod_verified_at timestamptz,
  add column if not exists last_scan_code text,
  add column if not exists last_scan_type text,
  add column if not exists last_scan_at timestamptz,
  add column if not exists last_scan_by text;

alter table if exists public.delivery_orders
  drop constraint if exists delivery_orders_delivery_status_check;

alter table if exists public.delivery_orders
  add constraint delivery_orders_delivery_status_check
  check (delivery_status in (
    'DRAFT',
    'SAVED',
    'SUBMITTED',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'FAILED_ATTEMPT',
    'RETURNED',
    'CANCELLED'
  ));

alter table if exists public.delivery_orders
  drop constraint if exists delivery_orders_pod_status_check;

alter table if exists public.delivery_orders
  add constraint delivery_orders_pod_status_check
  check (pod_status in ('PENDING','COMPLETE','FAILED','RETURNED'));

create table if not exists public.delivery_scan_events (
  id uuid primary key default gen_random_uuid(),
  delivery_id text not null,
  pickup_id text,
  scan_code text not null,
  scan_type text not null,
  scanned_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.delivery_workflow_logs (
  id uuid primary key default gen_random_uuid(),
  delivery_id text not null,
  pickup_id text,
  action text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_delivery_scan_events_delivery_id
on public.delivery_scan_events(delivery_id);

create index if not exists idx_delivery_workflow_logs_delivery_id
on public.delivery_workflow_logs(delivery_id);

insert into storage.buckets (id, name, public)
values ('pod-files', 'pod-files', true)
on conflict (id) do nothing;
