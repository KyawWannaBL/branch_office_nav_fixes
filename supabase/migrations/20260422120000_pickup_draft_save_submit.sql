create extension if not exists pgcrypto;

create table if not exists public.document_daily_sequences (
  seq_date date not null,
  org_abbr text not null,
  seq_kind text not null check (seq_kind in ('P','D')),
  last_seq integer not null default 0,
  primary key (seq_date, org_abbr, seq_kind)
);

create or replace function public.reserve_document_id(
  p_seq_date date,
  p_org_abbr text,
  p_seq_kind text,
  p_existing_id text default null
)
returns text
language plpgsql
as $$
declare
  v_seq integer;
  v_prefix text;
begin
  if p_existing_id is not null and btrim(p_existing_id) <> '' then
    return p_existing_id;
  end if;

  insert into public.document_daily_sequences (seq_date, org_abbr, seq_kind, last_seq)
  values (p_seq_date, upper(p_org_abbr), upper(p_seq_kind), 1)
  on conflict (seq_date, org_abbr, seq_kind)
  do update set last_seq = public.document_daily_sequences.last_seq + 1
  returning last_seq into v_seq;

  v_prefix := case upper(p_seq_kind) when 'P' then 'P' else 'D' end;

  return v_prefix || to_char(p_seq_date, 'MMDD') || '-' || upper(p_org_abbr) || '-' || lpad(v_seq::text, 3, '0');
end;
$$;

alter table if exists public.pickup_batches
  add column if not exists org_abbr text,
  add column if not exists pickup_status text not null default 'DRAFT',
  add column if not exists expected_way_count integer not null default 1,
  add column if not exists actual_way_count integer not null default 0,
  add column if not exists pickup_by_2 text,
  add column if not exists pickup_window text,
  add column if not exists remarks text,
  add column if not exists draft_saved_at timestamptz,
  add column if not exists submitted_at timestamptz,
  add column if not exists version_no integer not null default 1,
  add column if not exists locked_fields boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'pickup_batches_status_check'
  ) then
    alter table public.pickup_batches
      add constraint pickup_batches_status_check
      check (pickup_status in ('DRAFT','SAVED','SUBMITTED','ASSIGNED','IN_PROGRESS','PICKED_UP','PARTIAL_PICKED_UP','CANCELLED','CLOSED'));
  end if;
end $$;

alter table if exists public.delivery_orders
  add column if not exists parcel_count integer not null default 1,
  add column if not exists detail_status text not null default 'DRAFT',
  add column if not exists photo_evidence_status text not null default 'PENDING',
  add column if not exists qr_status text not null default 'PENDING',
  add column if not exists waybill_print_status text not null default 'PENDING';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'delivery_orders_detail_status_check'
  ) then
    alter table public.delivery_orders
      add constraint delivery_orders_detail_status_check
      check (detail_status in ('DRAFT','SAVED','SUBMITTED','READY','PICKED_UP','NOT_PICKED','RETURNED_TO_SENDER','CANCELLED'));
  end if;
end $$;

create table if not exists public.pickup_audit_logs (
  id uuid primary key default gen_random_uuid(),
  pickup_batch_id uuid references public.pickup_batches(id) on delete cascade,
  pickup_id text not null,
  action text not null,
  actor_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.pickup_status_history (
  id uuid primary key default gen_random_uuid(),
  pickup_batch_id uuid references public.pickup_batches(id) on delete cascade,
  pickup_id text not null,
  from_status text,
  to_status text not null,
  changed_by uuid,
  changed_at timestamptz not null default now()
);

create table if not exists public.pickup_attachments (
  id uuid primary key default gen_random_uuid(),
  pickup_batch_id uuid not null references public.pickup_batches(id) on delete cascade,
  pickup_id text not null,
  attachment_type text not null,
  file_name text not null,
  file_url text not null,
  mime_type text,
  uploaded_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_pickup_batches_status on public.pickup_batches(pickup_status);
create index if not exists idx_pickup_batches_pickup_date on public.pickup_batches(pickup_date);
create index if not exists idx_pickup_audit_logs_pickup_id on public.pickup_audit_logs(pickup_id);
create index if not exists idx_pickup_status_history_pickup_id on public.pickup_status_history(pickup_id);
