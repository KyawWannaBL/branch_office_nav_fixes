-- Seed / upsert tariff master rates
-- Assumes table:
--   public.master_tariffs(
--     region text,
--     township text,
--     rate_mmk numeric,
--     weight_limit_kg numeric,
--     category text
--   )

-- 1) Ensure a stable uniqueness key for upsert
create unique index if not exists ux_master_tariffs_region_township_category_weight
on public.master_tariffs(region, township, category, weight_limit_kg);

-- 2) Upsert the tariff rows
insert into public.master_tariffs (
  region,
  township,
  rate_mmk,
  weight_limit_kg,
  category
)
values
  ('Yangon', 'Pabedan', 4000, 3, 'Standard'),
  ('Yangon', 'Kyauktada', 4000, 3, 'Standard'),
  ('Yangon', 'Lanmadaw', 4000, 3, 'Standard'),
  ('Yangon', 'Latha', 4000, 3, 'Standard'),
  ('Yangon', 'Puzundaung', 4000, 3, 'Standard'),
  ('Yangon', 'Botahtaung', 4000, 3, 'Standard'),
  ('Yangon', 'Dagon', 4000, 3, 'Standard'),
  ('Yangon', 'Ahlone', 4000, 3, 'Standard'),
  ('Yangon', 'Kyi Myin Dine', 4000, 3, 'Standard'),
  ('Yangon', 'Sanchaung', 4000, 3, 'Standard'),
  ('Yangon', 'Bahan', 4000, 3, 'Standard'),
  ('Yangon', 'Tamwe', 4000, 3, 'Standard'),
  ('Yangon', 'Mingalar Taung Nyunt', 4000, 3, 'Standard'),
  ('Yangon', 'Yankin', 4000, 3, 'Standard'),
  ('Yangon', 'Kamayut', 4000, 3, 'Standard'),
  ('Yangon', 'Insein', 4000, 3, 'Standard'),
  ('Yangon', 'South Okkalapa', 4000, 3, 'Standard'),
  ('Yangon', 'North Okkalapa', 4000, 3, 'Standard'),
  ('Yangon', 'East Dagon', 4000, 3, 'Standard'),
  ('Yangon', 'North Dagon', 4000, 3, 'Standard'),
  ('Yangon', 'South Dagon', 4000, 3, 'Standard'),
  ('Yangon', 'Dagon Seikkan', 4000, 3, 'Standard'),
  ('Yangon', 'Mayangone', 4000, 3, 'Standard'),
  ('Yangon', 'Thaketa', 4000, 3, 'Standard'),
  ('Yangon', 'Dawbon', 4000, 3, 'Standard'),
  ('Yangon', 'Hlaing', 4000, 3, 'Standard'),
  ('Yangon', 'Thingangyun', 4000, 3, 'Standard'),
  ('Yangon', 'Hlaing Tharyar', 4500, 3, 'Extended'),
  ('Yangon', 'Shwepyitha', 4500, 3, 'Extended'),
  ('Yangon', 'Mingaladon', 4500, 3, 'Extended'),
  ('Yangon', 'Shwe Pauk Kan', 4500, 3, 'Extended'),
  ('Yangon', 'Aung Mingalar Highway', 3000, 3, 'Gate/Station'),
  ('Yangon', 'Aung San Stadium', 3000, 3, 'Gate/Station'),
  ('Yangon', 'Bayint Naung (Near)', 3000, 3, 'Gate/Station'),
  ('Yangon', 'Dagon Ayeyar Highway', 4000, 3, 'Gate/Station'),
  ('Yangon', 'Bayint Naung (Far)', 4000, 3, 'Gate/Station'),
  ('Mandalay', 'Amarapura', 6000, 3, 'Standard'),
  ('Mandalay', 'Aungmyethazan', 6000, 3, 'Standard'),
  ('Mandalay', 'Chanayethazan', 6000, 3, 'Standard'),
  ('Mandalay', 'Chanmyathazi', 6000, 3, 'Standard'),
  ('Mandalay', 'Mahar Aung Myay', 6000, 3, 'Standard'),
  ('Mandalay', 'Patheingyi', 6000, 3, 'Standard'),
  ('Mandalay', 'Pyigyitagon', 6000, 3, 'Standard'),
  ('Naypyidaw', 'Pyinmanar', 6000, 3, 'Standard'),
  ('Naypyidaw', 'Pobbathiri', 6000, 3, 'Standard'),
  ('Naypyidaw', 'Zeyarthiri', 6000, 3, 'Standard'),
  ('Naypyidaw', 'Ottarathiri', 6000, 3, 'Standard'),
  ('Naypyidaw', 'Dekkhinathiri', 6000, 3, 'Standard'),
  ('Naypyidaw', 'Zabuthiri', 6000, 3, 'Standard')
on conflict (region, township, category, weight_limit_kg)
do update set
  rate_mmk = excluded.rate_mmk;