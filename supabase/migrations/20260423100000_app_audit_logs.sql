create table if not exists public.app_audit_logs (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  request_id text not null,
  actor_name text,
  actor_role text,
  actor_email text,
  action text not null,
  resource_type text not null,
  resource_id text,
  target_status text,
  source_ip text,
  user_agent text,
  payload jsonb,
  before_state jsonb,
  after_state jsonb
);

create index if not exists idx_app_audit_logs_occurred_at
on public.app_audit_logs(occurred_at desc);

create index if not exists idx_app_audit_logs_action
on public.app_audit_logs(action);

create index if not exists idx_app_audit_logs_resource
on public.app_audit_logs(resource_type, resource_id);

create index if not exists idx_app_audit_logs_actor
on public.app_audit_logs(actor_role, actor_name);
