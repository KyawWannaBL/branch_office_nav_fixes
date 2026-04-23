alter table if exists public.delivery_orders
  add column if not exists reattempt_scheduled_at timestamptz,
  add column if not exists reattempt_note text,
  add column if not exists exception_status text not null default 'NONE',
  add column if not exists pod_review_status text not null default 'PENDING',
  add column if not exists pod_reviewed_at timestamptz,
  add column if not exists pod_reviewed_by text,
  add column if not exists rts_at timestamptz,
  add column if not exists rts_reason text;

alter table if exists public.delivery_orders
  drop constraint if exists delivery_orders_exception_status_check;

alter table if exists public.delivery_orders
  add constraint delivery_orders_exception_status_check
  check (exception_status in ('NONE','FAILED_ATTEMPT','REATTEMPT_SCHEDULED','RETURNED','RTS','POD_REVIEW'));

alter table if exists public.delivery_orders
  drop constraint if exists delivery_orders_pod_review_status_check;

alter table if exists public.delivery_orders
  add constraint delivery_orders_pod_review_status_check
  check (pod_review_status in ('PENDING','VERIFIED','REJECTED'));

create table if not exists public.delivery_exception_logs (
  id uuid primary key default gen_random_uuid(),
  delivery_id text not null,
  pickup_id text,
  action text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_delivery_exception_logs_delivery_id
on public.delivery_exception_logs(delivery_id);
