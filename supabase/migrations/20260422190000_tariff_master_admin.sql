alter table if exists public.tariff_rate_cards
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_tariff_rate_cards_service_type
on public.tariff_rate_cards(service_type);

create index if not exists idx_tariff_rate_cards_township
on public.tariff_rate_cards(township);
