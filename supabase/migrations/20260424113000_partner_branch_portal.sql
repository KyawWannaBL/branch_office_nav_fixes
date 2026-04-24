begin;

create extension if not exists pgcrypto;

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  branch_code varchar(50) not null unique,
  branch_name varchar(255) not null,
  city varchar(255) not null,
  township varchar(255) not null,
  address text,
  status varchar(50) not null default 'ACTIVE',
  is_distribution_center boolean not null default false,
  commission_rate numeric(12,4) not null default 0.1500,
  remote_surcharge numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.branch_user_links (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete cascade,
  user_id uuid not null,
  role varchar(50) not null default 'STAFF',
  created_at timestamptz not null default now(),
  unique(branch_id, user_id)
);

commit;
