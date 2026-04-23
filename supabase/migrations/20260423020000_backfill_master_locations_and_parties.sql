-- 1) seed guaranteed fallback locations
insert into public.master_locations (city, township, state_region, active)
values
  ('Yangon', 'Lanmadaw', 'Yangon', true),
  ('Yangon', 'Latha', 'Yangon', true),
  ('Yangon', 'Pabedan', 'Yangon', true),
  ('Yangon', 'Mingalar Taung Nyunt', 'Yangon', true),
  ('Yangon', 'Kamayut', 'Yangon', true),
  ('Yangon', 'Mayangone', 'Yangon', true),
  ('Yangon', 'Sanchaung', 'Yangon', true),
  ('Yangon', 'Thingangyun', 'Yangon', true),
  ('Yangon', 'Bahan', 'Yangon', true),
  ('Yangon', 'Tamwe', 'Yangon', true),
  ('Mandalay', 'Chan Aye Tharzan', 'Mandalay', true),
  ('Mandalay', 'Maha Aung Myay', 'Mandalay', true),
  ('Mandalay', 'Aung Myay Tharzan', 'Mandalay', true),
  ('Mandalay', 'Pyigyidagun', 'Mandalay', true),
  ('Naypyidaw', 'Zabuthiri', 'Naypyidaw', true),
  ('Naypyidaw', 'Dekkhinathiri', 'Naypyidaw', true)
on conflict (city, township) do nothing;

-- 2) seed guaranteed fallback parties
insert into public.master_parties (
  party_code, party_type, business_name, contact_name, phone, address, city, township, active, updated_at
)
values
  ('MER-001', 'merchant', 'Baby Kyaw', 'Baby Kyaw', '09 421 000 111', 'No. 12, Pyay Road', 'Yangon', 'Kamayut', true, now()),
  ('MER-002', 'merchant', 'HAIM', 'Zaw Min Htun', '09 421 000 222', 'Bo Yar Nyunt Road', 'Yangon', 'Mingalar Taung Nyunt', true, now()),
  ('MER-003', 'merchant', 'Best Buy in Rangoon', 'Shwe Zin', '09 421 000 333', 'Yuzana Plaza', 'Yangon', 'Mingalar Taung Nyunt', true, now()),
  ('MER-004', 'merchant', 'Mee Lay', 'Mee Lay', '09 421 000 444', 'Mahar Myaing Street', 'Yangon', 'Sanchaung', true, now()),
  ('CUS-001', 'customer', 'Daw Hla', 'Daw Hla', '09 445 778 112', 'No. 8, Lanmadaw', 'Yangon', 'Lanmadaw', true, now()),
  ('CUS-002', 'customer', 'Ko Min Thu', 'Ko Min Thu', '09 773 990 008', 'Chan Aye Tharzan', 'Mandalay', 'Chan Aye Tharzan', true, now()),
  ('CUS-003', 'customer', 'Ma Ei Ei', 'Ma Ei Ei', '09 550 222 116', 'Thuwunna Main Road', 'Yangon', 'Thingangyun', true, now())
on conflict (party_code) do nothing;

-- 3) backfill from pickup_batches only if columns exist
do $$
declare
  has_merchant_name boolean;
  has_contact_name boolean;
  has_contact_phone boolean;
  has_pickup_address boolean;
  has_pickup_city boolean;
  has_pickup_township boolean;
  contact_name_expr text;
  contact_phone_expr text;
  address_expr text;
  city_expr text;
  township_expr text;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'pickup_batches' and column_name = 'merchant_name'
  ) into has_merchant_name;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'pickup_batches' and column_name = 'contact_name'
  ) into has_contact_name;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'pickup_batches' and column_name = 'contact_phone'
  ) into has_contact_phone;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'pickup_batches' and column_name = 'pickup_address'
  ) into has_pickup_address;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'pickup_batches' and column_name = 'pickup_city'
  ) into has_pickup_city;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'pickup_batches' and column_name = 'pickup_township'
  ) into has_pickup_township;

  if has_pickup_city and has_pickup_township then
    execute $sql$
      insert into public.master_locations (city, township, state_region, active)
      select distinct pickup_city, pickup_township, null, true
      from public.pickup_batches
      where coalesce(trim(pickup_city), '') <> ''
        and coalesce(trim(pickup_township), '') <> ''
      on conflict (city, township) do nothing
    $sql$;
  end if;

  if has_merchant_name then
    contact_name_expr := case when has_contact_name then 'pb.contact_name' else 'null' end;
    contact_phone_expr := case when has_contact_phone then 'pb.contact_phone' else 'null' end;
    address_expr := case when has_pickup_address then 'pb.pickup_address' else 'null' end;
    city_expr := case when has_pickup_city then 'pb.pickup_city' else 'null' end;
    township_expr := case when has_pickup_township then 'pb.pickup_township' else 'null' end;

    execute format($sql$
      insert into public.master_parties (
        party_code, party_type, business_name, contact_name, phone, address, city, township, active, updated_at
      )
      select distinct
        null,
        'merchant',
        pb.merchant_name,
        %s,
        %s,
        %s,
        %s,
        %s,
        true,
        now()
      from public.pickup_batches pb
      where coalesce(trim(pb.merchant_name), '') <> ''
        and not exists (
          select 1
          from public.master_parties mp
          where mp.party_type = 'merchant'
            and lower(mp.business_name) = lower(pb.merchant_name)
        )
    $sql$, contact_name_expr, contact_phone_expr, address_expr, city_expr, township_expr);
  end if;
end $$;

-- 4) backfill from delivery_orders only if columns exist
do $$
declare
  has_receiver_name boolean;
  has_receiver_phone boolean;
  has_receiver_address boolean;
  has_delivery_address boolean;
  has_receiver_city boolean;
  has_receiver_township boolean;
  has_township boolean;
  phone_expr text;
  address_expr text;
  city_expr text;
  township_expr text;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'delivery_orders' and column_name = 'receiver_name'
  ) into has_receiver_name;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'delivery_orders' and column_name = 'receiver_phone'
  ) into has_receiver_phone;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'delivery_orders' and column_name = 'receiver_address'
  ) into has_receiver_address;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'delivery_orders' and column_name = 'delivery_address'
  ) into has_delivery_address;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'delivery_orders' and column_name = 'receiver_city'
  ) into has_receiver_city;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'delivery_orders' and column_name = 'receiver_township'
  ) into has_receiver_township;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'delivery_orders' and column_name = 'township'
  ) into has_township;

  if has_receiver_city and (has_receiver_township or has_township) then
    township_expr := case
      when has_receiver_township and has_township then 'coalesce(receiver_township, township)'
      when has_receiver_township then 'receiver_township'
      else 'township'
    end;

    execute format($sql$
      insert into public.master_locations (city, township, state_region, active)
      select distinct receiver_city, %s, null, true
      from public.delivery_orders
      where coalesce(trim(receiver_city), '') <> ''
        and coalesce(trim(%s), '') <> ''
      on conflict (city, township) do nothing
    $sql$, township_expr, township_expr);
  end if;

  if has_receiver_name then
    phone_expr := case when has_receiver_phone then 'd.receiver_phone' else 'null' end;

    address_expr := case
      when has_receiver_address and has_delivery_address then 'coalesce(d.receiver_address, d.delivery_address)'
      when has_receiver_address then 'd.receiver_address'
      when has_delivery_address then 'd.delivery_address'
      else 'null'
    end;

    city_expr := case when has_receiver_city then 'd.receiver_city' else 'null' end;

    township_expr := case
      when has_receiver_township and has_township then 'coalesce(d.receiver_township, d.township)'
      when has_receiver_township then 'd.receiver_township'
      when has_township then 'd.township'
      else 'null'
    end;

    execute format($sql$
      insert into public.master_parties (
        party_code, party_type, business_name, contact_name, phone, address, city, township, active, updated_at
      )
      select distinct
        null,
        'customer',
        d.receiver_name,
        d.receiver_name,
        %s,
        %s,
        %s,
        %s,
        true,
        now()
      from public.delivery_orders d
      where coalesce(trim(d.receiver_name), '') <> ''
        and not exists (
          select 1
          from public.master_parties mp
          where mp.party_type = 'customer'
            and lower(mp.business_name) = lower(d.receiver_name)
        )
    $sql$, phone_expr, address_expr, city_expr, township_expr);
  end if;
end $$;
