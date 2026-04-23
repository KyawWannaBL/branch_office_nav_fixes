alter table if exists public.dispatch_batches
  add column if not exists dispatched_at timestamptz,
  add column if not exists dispatched_by text,
  add column if not exists dispatch_scan_code text,
  add column if not exists dispatch_note text;
