begin;

create extension if not exists pgcrypto;

create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  campaign_code varchar(120) unique,
  title varchar(255) not null,
  campaign_type varchar(80) not null default 'PROMO_CODE',
  status varchar(50) not null default 'DRAFT',
  promo_code varchar(120),
  discount_type varchar(50) not null default 'PERCENT',
  discount_value numeric(12,2) not null default 0,
  waives_overweight_surcharge boolean not null default false,
  geo_origin_city varchar(120),
  geo_origin_township varchar(120),
  geo_destination_city varchar(120),
  geo_destination_township varchar(120),
  applies_to_new_merchants boolean not null default false,
  volume_threshold integer not null default 0,
  cashback_amount numeric(12,2) not null default 0,
  start_date date,
  end_date date,
  description text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_leads (
  id uuid primary key default gen_random_uuid(),
  company_name varchar(255) not null,
  contact_name varchar(255),
  phone varchar(80),
  email varchar(255),
  city varchar(120),
  township varchar(120),
  lead_status varchar(80) not null default 'COLD_LEAD',
  monthly_way_target integer not null default 0,
  proposed_tariff_rate numeric(12,2) not null default 0,
  notes text,
  assigned_to uuid,
  converted_party_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_assets (
  id uuid primary key default gen_random_uuid(),
  asset_name varchar(255) not null,
  asset_type varchar(80) not null default 'IMAGE',
  asset_category varchar(120) not null default 'BRAND',
  file_url text not null,
  branch_scope varchar(120) not null default 'GLOBAL',
  is_verified boolean not null default true,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.broadcast_jobs (
  id uuid primary key default gen_random_uuid(),
  audience_type varchar(80) not null default 'MERCHANTS',
  channel varchar(80) not null default 'IN_APP',
  title varchar(255) not null,
  message text not null,
  target_filter jsonb not null default '{}'::jsonb,
  status varchar(50) not null default 'QUEUED',
  sent_count integer not null default 0,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.merchant_wallet_credits (
  id uuid primary key default gen_random_uuid(),
  party_id uuid,
  campaign_id uuid references public.marketing_campaigns(id) on delete set null,
  credit_type varchar(80) not null default 'CASHBACK',
  credit_amount numeric(12,2) not null default 0,
  status varchar(50) not null default 'POSTED',
  remarks text,
  created_at timestamptz not null default now()
);

create index if not exists idx_marketing_campaigns_status on public.marketing_campaigns(status);
create index if not exists idx_marketing_campaigns_dates on public.marketing_campaigns(start_date, end_date);
create index if not exists idx_marketing_leads_status on public.marketing_leads(lead_status);
create index if not exists idx_marketing_assets_category on public.marketing_assets(asset_category);
create index if not exists idx_broadcast_jobs_status on public.broadcast_jobs(status);
create index if not exists idx_wallet_credits_party on public.merchant_wallet_credits(party_id);

commit;
