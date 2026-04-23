create table if not exists public.rider_handover_reports (
  id uuid primary key default gen_random_uuid(),
  report_id text not null unique,
  report_date date not null,
  rider_name text not null,
  rider_phone text,
  total_batches integer not null default 0,
  delivered_count integer not null default 0,
  failed_count integer not null default 0,
  returned_count integer not null default 0,
  cod_expected numeric(14,2) not null default 0,
  cod_collected numeric(14,2) not null default 0,
  shortage_amount numeric(14,2) not null default 0,
  overage_amount numeric(14,2) not null default 0,
  note text,
  created_at timestamptz not null default now()
);
