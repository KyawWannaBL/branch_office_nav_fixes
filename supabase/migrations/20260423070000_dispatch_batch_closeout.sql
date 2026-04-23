alter table if exists public.dispatch_batches
  add column if not exists returned_at timestamptz,
  add column if not exists returned_by text,
  add column if not exists closeout_note text,
  add column if not exists delivered_count integer not null default 0,
  add column if not exists failed_count integer not null default 0,
  add column if not exists returned_count integer not null default 0,
  add column if not exists cod_expected numeric(14,2) not null default 0,
  add column if not exists cod_collected numeric(14,2) not null default 0,
  add column if not exists shortage_amount numeric(14,2) not null default 0,
  add column if not exists overage_amount numeric(14,2) not null default 0;
