begin;

do $$
begin
  if to_regclass('public.master_tariffs') is null then
    raise notice 'Skipping legacy tariff seed: public.master_tariffs does not exist in this environment.';
    return;
  end if;

  execute '
    create unique index if not exists ux_master_tariffs_region_township_category_weight
    on public.master_tariffs(region, township, category, weight_limit_kg)
  ';

  -- Legacy seed intentionally skipped here.
  -- This project now uses public.domestic_tariffs instead of public.master_tariffs.
end $$;

commit;
