create extension if not exists pgcrypto;

create table if not exists public.master_parties (
  id uuid primary key default gen_random_uuid(),
  party_code text unique,
  party_type text not null check (party_type in ('merchant','customer','online_store','branch','other')),
  business_name text not null,
  contact_name text,
  phone text,
  alt_phone text,
  email text,
  address text,
  city text,
  township text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_master_parties_type on public.master_parties(party_type);
create index if not exists idx_master_parties_business_name on public.master_parties(business_name);
create index if not exists idx_master_parties_city_township on public.master_parties(city, township);

create table if not exists public.master_locations (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  township text not null,
  state_region text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(city, township)
);

create index if not exists idx_master_locations_city on public.master_locations(city);
create index if not exists idx_master_locations_township on public.master_locations(township);

insert into public.master_locations(city, township, state_region)
values
  ('Yangon', 'Lanmadaw', 'Yangon'),
  ('Yangon', 'Latha', 'Yangon'),
  ('Yangon', 'Pabedan', 'Yangon'),
  ('Yangon', 'Mingalar Taung Nyunt', 'Yangon'),
  ('Yangon', 'Kamayut', 'Yangon'),
  ('Yangon', 'Mayangone', 'Yangon'),
  ('Yangon', 'Sanchaung', 'Yangon'),
  ('Yangon', 'Thingangyun', 'Yangon'),
  ('Yangon', 'Bahan', 'Yangon'),
  ('Yangon', 'Tamwe', 'Yangon'),
  ('Mandalay', 'Chan Aye Tharzan', 'Mandalay'),
  ('Mandalay', 'Maha Aung Myay', 'Mandalay'),
  ('Mandalay', 'Aung Myay Tharzan', 'Mandalay'),
  ('Mandalay', 'Pyigyidagun', 'Mandalay'),
  ('Naypyidaw', 'Zabuthiri', 'Naypyidaw'),
  ('Naypyidaw', 'Dekkhinathiri', 'Naypyidaw')
on conflict do nothing;

insert into public.master_parties(party_code, party_type, business_name, contact_name, phone, address, city, township)
values
  ('MER-001', 'merchant', 'Baby Kyaw', 'Baby Kyaw', '09 421 000 111', 'No. 12, Pyay Road', 'Yangon', 'Kamayut'),
  ('MER-002', 'merchant', 'HAIM', 'Zaw Min Htun', '09 421 000 222', 'Bo Yar Nyunt Road', 'Yangon', 'Mingalar Taung Nyunt'),
  ('MER-003', 'merchant', 'Best Buy in Rangoon', 'Shwe Zin', '09 421 000 333', 'Yuzana Plaza', 'Yangon', 'Mingalar Taung Nyunt'),
  ('MER-004', 'merchant', 'Mee Lay', 'Mee Lay', '09 421 000 444', 'Mahar Myaing Street', 'Yangon', 'Sanchaung'),
  ('CUS-001', 'customer', 'Daw Hla', 'Daw Hla', '09 445 778 112', 'No. 8, Lanmadaw', 'Yangon', 'Lanmadaw'),
  ('CUS-002', 'customer', 'Ko Min Thu', 'Ko Min Thu', '09 773 990 008', 'Chan Aye Tharzan', 'Mandalay', 'Chan Aye Tharzan'),
  ('CUS-003', 'customer', 'Ma Ei Ei', 'Ma Ei Ei', '09 550 222 116', 'Thuwunna Main Road', 'Yangon', 'Thingangyun')
on conflict do nothing;
