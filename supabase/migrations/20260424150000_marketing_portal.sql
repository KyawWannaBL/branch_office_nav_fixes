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

alter table public.marketing_campaigns add column if not exists campaign_code varchar(120);
alter table public.marketing_campaigns add column if not exists title varchar(255);
alter table public.marketing_campaigns add column if not exists campaign_type varchar(80);
alter table public.marketing_campaigns add column if not exists status varchar(50);
alter table public.marketing_campaigns add column if not exists promo_code varchar(120);
alter table public.marketing_campaigns add column if not exists discount_type varchar(50);
alter table public.marketing_campaigns add column if not exists discount_value numeric(12,2) default 0;
alter table public.marketing_campaigns add column if not exists waives_overweight_surcharge boolean default false;
alter table public.marketing_campaigns add column if not exists geo_origin_city varchar(120);
alter table public.marketing_campaigns add column if not exists geo_origin_township varchar(120);
alter table public.marketing_campaigns add column if not exists geo_destination_city varchar(120);
alter table public.marketing_campaigns add column if not exists geo_destination_township varchar(120);
alter table public.marketing_campaigns add column if not exists applies_to_new_merchants boolean default false;
alter table public.marketing_campaigns add column if not exists volume_threshold integer default 0;
alter table public.marketing_campaigns add column if not exists cashback_amount numeric(12,2) default 0;
alter table public.marketing_campaigns add column if not exists start_date date;
alter table public.marketing_campaigns add column if not exists end_date date;
alter table public.marketing_campaigns add column if not exists description text;
alter table public.marketing_campaigns add column if not exists created_by uuid;
alter table public.marketing_campaigns add column if not exists updated_by uuid;
alter table public.marketing_campaigns add column if not exists created_at timestamptz default now();
alter table public.marketing_campaigns add column if not exists updated_at timestamptz default now();

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

alter table public.marketing_leads add column if not exists company_name varchar(255);
alter table public.marketing_leads add column if not exists contact_name varchar(255);
alter table public.marketing_leads add column if not exists phone varchar(80);
alter table public.marketing_leads add column if not exists email varchar(255);
alter table public.marketing_leads add column if not exists city varchar(120);
alter table public.marketing_leads add column if not exists township varchar(120);
alter table public.marketing_leads add column if not exists lead_status varchar(80);
alter table public.marketing_leads add column if not exists monthly_way_target integer default 0;
alter table public.marketing_leads add column if not exists proposed_tariff_rate numeric(12,2) default 0;
alter table public.marketing_leads add column if not exists notes text;
alter table public.marketing_leads add column if not exists assigned_to uuid;
alter table public.marketing_leads add column if not exists converted_party_id uuid;
alter table public.marketing_leads add column if not exists created_at timestamptz default now();
alter table public.marketing_leads add column if not exists updated_at timestamptz default now();

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

alter table public.marketing_assets add column if not exists asset_name varchar(255);
alter table public.marketing_assets add column if not exists asset_type varchar(80);
alter table public.marketing_assets add column if not exists asset_category varchar(120);
alter table public.marketing_assets add column if not exists file_url text;
alter table public.marketing_assets add column if not exists branch_scope varchar(120);
alter table public.marketing_assets add column if not exists is_verified boolean default true;
alter table public.marketing_assets add column if not exists notes text;
alter table public.marketing_assets add column if not exists created_by uuid;
alter table public.marketing_assets add column if not exists created_at timestamptz default now();

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

alter table public.broadcast_jobs add column if not exists audience_type varchar(80);
alter table public.broadcast_jobs add column if not exists channel varchar(80);
alter table public.broadcast_jobs add column if not exists title varchar(255);
alter table public.broadcast_jobs add column if not exists message text;
alter table public.broadcast_jobs add column if not exists target_filter jsonb default '{}'::jsonb;
alter table public.broadcast_jobs add column if not exists status varchar(50);
alter table public.broadcast_jobs add column if not exists sent_count integer default 0;
alter table public.broadcast_jobs add column if not exists created_by uuid;
alter table public.broadcast_jobs add column if not exists created_at timestamptz default now();

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

alter table public.merchant_wallet_credits add column if not exists party_id uuid;
alter table public.merchant_wallet_credits add column if not exists campaign_id uuid;
alter table public.merchant_wallet_credits add column if not exists credit_type varchar(80);
alter table public.merchant_wallet_credits add column if not exists credit_amount numeric(12,2) default 0;
alter table public.merchant_wallet_credits add column if not exists status varchar(50);
alter table public.merchant_wallet_credits add column if not exists remarks text;
alter table public.merchant_wallet_credits add column if not exists created_at timestamptz default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'merchant_wallet_credits_campaign_id_fkey'
  ) then
    alter table public.merchant_wallet_credits
      add constraint merchant_wallet_credits_campaign_id_fkey
      foreign key (campaign_id) references public.marketing_campaigns(id) on delete set null;
  end if;
end $$;

create unique index if not exists idx_marketing_campaigns_code on public.marketing_campaigns(campaign_code);
create index if not exists idx_marketing_campaigns_status on public.marketing_campaigns(status);
create index if not exists idx_marketing_campaigns_dates on public.marketing_campaigns(start_date, end_date);
create index if not exists idx_marketing_leads_status on public.marketing_leads(lead_status);
create index if not exists idx_marketing_assets_category on public.marketing_assets(asset_category);
create index if not exists idx_broadcast_jobs_status on public.broadcast_jobs(status);
create index if not exists idx_wallet_credits_party on public.merchant_wallet_credits(party_id);

commit;
