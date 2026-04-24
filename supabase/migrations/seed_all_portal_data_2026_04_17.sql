
-- ============================================================
-- BRITIUM EXPRESS - COMPREHENSIVE SEED DATA  2026_04_17
-- ============================================================

-- -------------------------------------------------------
-- 1. WAREHOUSES
-- -------------------------------------------------------
INSERT INTO public.warehouses (id, name, code, type, address, city, state, country, capacity, current_stock, status, operating_hours, manager_id, created_at, updated_at)
VALUES
  ('w1000000-0000-0000-0000-000000000001', 'Yangon Main Hub',    'YGN-HUB', 'hub',     '45 Industrial Zone, Mingaladon',      'Yangon',    'Yangon',  'Myanmar', 5000, 1820, 'active', '08:00-20:00', NULL, NOW(), NOW()),
  ('w1000000-0000-0000-0000-000000000002', 'Mandalay Warehouse', 'MDY-WH',  'branch',  '12 Chan Aye Tharzan Rd',              'Mandalay',  'Mandalay','Myanmar', 2000,  640, 'active', '08:00-18:00', NULL, NOW(), NOW()),
  ('w1000000-0000-0000-0000-000000000003', 'Naypyidaw Depot',    'NPT-DEP', 'depot',   '88 Naypyidaw Business Park',          'Naypyidaw', 'NPT',     'Myanmar', 1000,  210, 'active', '07:00-17:00', NULL, NOW(), NOW()),
  ('w1000000-0000-0000-0000-000000000004', 'Bago Transit Point', 'BGO-TP',  'transit', '5 Station Road, Bago',                'Bago',      'Bago',    'Myanmar',  500,   88, 'active', '08:00-18:00', NULL, NOW(), NOW()),
  ('w1000000-0000-0000-0000-000000000005', 'Pathein Outpost',    'PTH-OUT', 'outpost', '22 Inya Road, Pathein',               'Pathein',   'Ayeyarwady','Myanmar',300,   45, 'inactive','08:00-16:00', NULL, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- 2. VEHICLES
-- -------------------------------------------------------
INSERT INTO public.vehicles (id, plate_number, vehicle_type, model, capacity_kg, status, warehouse_id, created_at, updated_at)
VALUES
  ('v1000000-0000-0000-0000-000000000001', 'YGN-1234', 'van',      'Toyota Hiace',    1000, 'available',   'w1000000-0000-0000-0000-000000000001', NOW(), NOW()),
  ('v1000000-0000-0000-0000-000000000002', 'YGN-5678', 'van',      'Mitsubishi L300',  800, 'in_use',      'w1000000-0000-0000-0000-000000000001', NOW(), NOW()),
  ('v1000000-0000-0000-0000-000000000003', 'YGN-9012', 'truck',    'Isuzu NKR',       3000, 'available',   'w1000000-0000-0000-0000-000000000001', NOW(), NOW()),
  ('v1000000-0000-0000-0000-000000000004', 'MDY-1111', 'van',      'Toyota Hiace',    1000, 'available',   'w1000000-0000-0000-0000-000000000002', NOW(), NOW()),
  ('v1000000-0000-0000-0000-000000000005', 'MDY-2222', 'motorcycle','Honda CB125',      80, 'in_use',      'w1000000-0000-0000-0000-000000000002', NOW(), NOW()),
  ('v1000000-0000-0000-0000-000000000006', 'YGN-3344', 'van',      'Ford Transit',    1200, 'maintenance', 'w1000000-0000-0000-0000-000000000001', NOW(), NOW()),
  ('v1000000-0000-0000-0000-000000000007', 'NPT-5566', 'van',      'Mitsubishi L300',  800, 'available',   'w1000000-0000-0000-0000-000000000003', NOW(), NOW()),
  ('v1000000-0000-0000-0000-000000000008', 'YGN-7788', 'truck',    'Hino 300',        4000, 'available',   'w1000000-0000-0000-0000-000000000001', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- 3. SHIPMENTS  (20 realistic records)
-- -------------------------------------------------------
INSERT INTO public.shipments (id, awb, sender_name, sender_phone, sender_city, recipient_name, recipient_phone, recipient_city, recipient_address, service_type, weight, cod_amount, shipping_fee, status, payment_method, created_at, updated_at)
VALUES
  ('s1000000-0000-0000-0000-000000000001','BX-2026-00001','Aung Thu Shop',     '+95911111111','Yangon',   'Ko Kyaw Zin',      '+95922222222','Mandalay',  '15 Zay Street, Chanmyathazi',  'express',  2.5, 15000, 4500, 'delivered',    'cod',     NOW()-INTERVAL'10 days', NOW()),
  ('s1000000-0000-0000-0000-000000000002','BX-2026-00002','Thin Thin Store',   '+95911111112','Yangon',   'Ma Aye Myat',      '+95922222223','Naypyidaw', '8 Yaza Thingaha Rd',           'standard', 1.2,  8000, 2500, 'delivered',    'cod',     NOW()-INTERVAL'9 days',  NOW()),
  ('s1000000-0000-0000-0000-000000000003','BX-2026-00003','Kyaw Electronics',  '+95911111113','Mandalay', 'U Thant Zin',      '+95922222224','Bago',      '44 Shwemawdaw Rd',             'standard', 3.0,     0, 3000, 'in_transit',   'prepaid', NOW()-INTERVAL'8 days',  NOW()),
  ('s1000000-0000-0000-0000-000000000004','BX-2026-00004','Online Fashion',    '+95911111114','Yangon',   'Ma Su Hlaing',     '+95922222225','Pathein',   '2 Inya Lake Rd',               'economy',  0.8, 12000, 2000, 'delivered',    'cod',     NOW()-INTERVAL'7 days',  NOW()),
  ('s1000000-0000-0000-0000-000000000005','BX-2026-00005','Tech Hub Myanmar',  '+95911111115','Yangon',   'Ko Myo Aung',      '+95922222226','Mandalay',  '77 78th Street',               'express',  5.0,     0, 6500, 'delivered',    'prepaid', NOW()-INTERVAL'6 days',  NOW()),
  ('s1000000-0000-0000-0000-000000000006','BX-2026-00006','Shwe Yatha Gems',   '+95911111116','Mandalay', 'Daw Khin May',     '+95922222227','Yangon',    '18 Merchant Road, Pabedan',    'express',  0.5, 45000, 5000, 'in_transit',   'cod',     NOW()-INTERVAL'5 days',  NOW()),
  ('s1000000-0000-0000-0000-000000000007','BX-2026-00007','Cool Gadgets',      '+95911111117','Yangon',   'Ko Pyae Phyo',     '+95922222228','Mawlamyine','12 Strand Road',               'standard', 2.0, 18000, 3200, 'pending',      'cod',     NOW()-INTERVAL'4 days',  NOW()),
  ('s1000000-0000-0000-0000-000000000008','BX-2026-00008','Bloom Beauty',      '+95911111118','Yangon',   'Ma Ei Phyu',       '+95922222229','Naypyidaw', '55 Yoma Complex',              'standard', 1.5,  9500, 2800, 'delivered',    'cod',     NOW()-INTERVAL'3 days',  NOW()),
  ('s1000000-0000-0000-0000-000000000009','BX-2026-00009','Myanmar Books',     '+95911111119','Yangon',   'Ko Thet Oo',       '+95922222230','Mandalay',  '25 Mandalay-Lashio Road',      'economy',  4.0,     0, 3500, 'delivered',    'prepaid', NOW()-INTERVAL'3 days',  NOW()),
  ('s1000000-0000-0000-0000-000000000010','BX-2026-00010','Alpha Pharma',      '+95911111120','Yangon',   'Dr Win Naing',     '+95922222231','Taunggyi',  '10 Shan Road, Taunggyi',       'express',  3.5,     0, 7000, 'in_transit',   'prepaid', NOW()-INTERVAL'2 days',  NOW()),
  ('s1000000-0000-0000-0000-000000000011','BX-2026-00011','Pyone Cho Fashion', '+95911111121','Mandalay', 'Ma Hnin Pwint',    '+95922222232','Yangon',    '3 Kaba Aye Pagoda Rd',         'standard', 1.8, 22000, 3000, 'pending',      'cod',     NOW()-INTERVAL'2 days',  NOW()),
  ('s1000000-0000-0000-0000-000000000012','BX-2026-00012','Bright Star Trading','+95911111122','Yangon',  'U Zaw Win',        '+95922222233','Bago',      '8 Station Road',               'standard', 6.0,     0, 4000, 'failed',       'prepaid', NOW()-INTERVAL'1 day',   NOW()),
  ('s1000000-0000-0000-0000-000000000013','BX-2026-00013','Myo Family Shop',   '+95911111123','Yangon',   'Ko Aung Myo',      '+95922222234','Mandalay',  '66 83rd Street',               'express',  2.2, 16000, 4800, 'out_for_delivery','cod',  NOW()-INTERVAL'1 day',   NOW()),
  ('s1000000-0000-0000-0000-000000000014','BX-2026-00014','Digital Dreams',    '+95911111124','Yangon',   'Ma Khaing Zin',    '+95922222235','Pathein',   '14 Strand Road',               'economy',  0.6,  7500, 1800, 'delivered',    'cod',     NOW()-INTERVAL'1 day',   NOW()),
  ('s1000000-0000-0000-0000-000000000015','BX-2026-00015','Nilar Flowers',     '+95911111125','Mandalay', 'Ma Thida Soe',     '+95922222236','Naypyidaw', '22 Thabyegone St',             'same-day', 0.3,  5000, 5500, 'delivered',    'cod',     NOW()-INTERVAL'12 hours',NOW()),
  ('s1000000-0000-0000-0000-000000000016','BX-2026-00016','Golden Star Market','+95911111126','Yangon',   'Ko Kyaw Myo Htun', '+95922222237','Mawlamyine','5 Bogyoke Rd',                 'standard', 3.8, 28000, 3400, 'pending',      'cod',     NOW()-INTERVAL'6 hours', NOW()),
  ('s1000000-0000-0000-0000-000000000017','BX-2026-00017','Sun Electronics',   '+95911111127','Yangon',   'Daw Than Than',    '+95922222238','Yangon',    '88 Insein Road, Hlaing',       'same-day', 1.1, 11000, 4200, 'in_transit',   'cod',     NOW()-INTERVAL'5 hours', NOW()),
  ('s1000000-0000-0000-0000-000000000018','BX-2026-00018','Aung Kyaw Trading', '+95911111128','Mandalay', 'Ma Sandar Win',    '+95922222239','Yangon',    '44 Botahtaung Pagoda Rd',      'express',  2.7, 19500, 4900, 'pending',      'cod',     NOW()-INTERVAL'4 hours', NOW()),
  ('s1000000-0000-0000-0000-000000000019','BX-2026-00019','MegaMart Online',   '+95911111129','Yangon',   'Ko Thura Aung',    '+95922222240','Mandalay',  '12 Mandalay Palace Rd',        'standard', 4.5,     0, 3800, 'out_for_delivery','prepaid',NOW()-INTERVAL'3 hours',NOW()),
  ('s1000000-0000-0000-0000-000000000020','BX-2026-00020','Star Cosmetics',    '+95911111130','Yangon',   'Ma Wai Phyo Oo',   '+95922222241','Naypyidaw', '77 Pyinmana Road',             'standard', 0.9, 13500, 2600, 'pending',      'cod',     NOW()-INTERVAL'1 hour',  NOW())
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- 4. MANIFESTS
-- -------------------------------------------------------
INSERT INTO public.manifests (id, manifest_number, driver_name, route_name, total_packages, status, warehouse_id, created_at, updated_at)
VALUES
  ('m1000000-0000-0000-0000-000000000001','MNF-2026-0001','Ko Zaw Linn',   'Yangon North Zone',    12, 'completed', 'w1000000-0000-0000-0000-000000000001', NOW()-INTERVAL'3 days', NOW()),
  ('m1000000-0000-0000-0000-000000000002','MNF-2026-0002','Ko Htet Aung',  'Yangon South Zone',     8, 'completed', 'w1000000-0000-0000-0000-000000000001', NOW()-INTERVAL'2 days', NOW()),
  ('m1000000-0000-0000-0000-000000000003','MNF-2026-0003','Ko Pyae Sone',  'Mandalay Central',     15, 'active',    'w1000000-0000-0000-0000-000000000002', NOW()-INTERVAL'1 day',  NOW()),
  ('m1000000-0000-0000-0000-000000000004','MNF-2026-0004','Ko Win Kyaw',   'Yangon East Zone',     10, 'active',    'w1000000-0000-0000-0000-000000000001', NOW()-INTERVAL'1 day',  NOW()),
  ('m1000000-0000-0000-0000-000000000005','MNF-2026-0005','Ko Thiha',      'Naypyidaw Route A',     6, 'pending',   'w1000000-0000-0000-0000-000000000003', NOW()-INTERVAL'6 hours', NOW()),
  ('m1000000-0000-0000-0000-000000000006','MNF-2026-0006','Ko Min Thura',  'Bago-Yangon Expressway',9, 'active',    'w1000000-0000-0000-0000-000000000004', NOW()-INTERVAL'4 hours', NOW()),
  ('m1000000-0000-0000-0000-000000000007','MNF-2026-0007','Ko Aung Kyaw',  'Yangon West Zone',      7, 'pending',   'w1000000-0000-0000-0000-000000000001', NOW()-INTERVAL'2 hours', NOW()),
  ('m1000000-0000-0000-0000-000000000008','MNF-2026-0008','Ko Ye Lwin',    'Mandalay South',       11, 'active',    'w1000000-0000-0000-0000-000000000002', NOW()-INTERVAL'1 hour',  NOW())
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- 5. COMPLAINTS
-- -------------------------------------------------------
INSERT INTO public.complaints (id, subject, description, status, priority, customer_name, created_at, updated_at)
VALUES
  ('c1000000-0000-0000-0000-000000000001','Package not delivered on time',      'My order BX-2026-00003 was supposed to arrive 3 days ago.', 'open',        'high',   'U Thant Zin',    NOW()-INTERVAL'2 days',  NOW()),
  ('c1000000-0000-0000-0000-000000000002','Wrong item delivered',               'Received completely different item in my package.',          'in_progress', 'urgent', 'Ma Ei Phyu',     NOW()-INTERVAL'1 day',   NOW()),
  ('c1000000-0000-0000-0000-000000000003','Package arrived damaged',            'Box was crushed and product inside was broken.',             'in_progress', 'high',   'Ko Pyae Phyo',   NOW()-INTERVAL'1 day',   NOW()),
  ('c1000000-0000-0000-0000-000000000004','Driver was rude to customer',        'Delivery driver was very impolite during handover.',         'open',        'medium', 'Daw Khin May',   NOW()-INTERVAL'18 hours',NOW()),
  ('c1000000-0000-0000-0000-000000000005','COD amount was overcharged',         'Driver collected more money than the stated COD amount.',    'resolved',    'high',   'Ko Myo Aung',    NOW()-INTERVAL'3 days',  NOW()),
  ('c1000000-0000-0000-0000-000000000006','Tracking not updating',              'Status has been "in transit" for 5 days with no update.',    'open',        'medium', 'Ma Su Hlaing',   NOW()-INTERVAL'12 hours',NOW()),
  ('c1000000-0000-0000-0000-000000000007','Package left at wrong address',      'Delivery was left at neighbor without my permission.',       'open',        'high',   'Ko Kyaw Zin',    NOW()-INTERVAL'6 hours', NOW()),
  ('c1000000-0000-0000-0000-000000000008','Refund not processed',               'My returned shipment was received but refund not issued.',   'in_progress', 'medium', 'Ma Aye Myat',    NOW()-INTERVAL'4 hours', NOW()),
  ('c1000000-0000-0000-0000-000000000009','Delivery attempt without notification','Driver did not call before delivering, I was not home.',  'resolved',    'low',    'U Zaw Win',      NOW()-INTERVAL'5 days',  NOW()),
  ('c1000000-0000-0000-0000-000000000010','App shows delivered but not received','Tracking says delivered but I never got the package.',      'open',        'urgent', 'Ko Thet Oo',     NOW()-INTERVAL'2 hours', NOW())
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- 6. ATTENDANCE
-- -------------------------------------------------------
INSERT INTO public.attendance (id, employee_name, date, check_in, check_out, status, created_at)
VALUES
  ('a1000000-0000-0000-0000-000000000001','Ko Zaw Linn',   CURRENT_DATE,              NOW()-INTERVAL'7 hours',  NOW()-INTERVAL'1 hour', 'present', NOW()),
  ('a1000000-0000-0000-0000-000000000002','Ko Htet Aung',  CURRENT_DATE,              NOW()-INTERVAL'8 hours',  NULL,                   'present', NOW()),
  ('a1000000-0000-0000-0000-000000000003','Ko Pyae Sone',  CURRENT_DATE,              NOW()-INTERVAL'6 hours',  NULL,                   'present', NOW()),
  ('a1000000-0000-0000-0000-000000000004','Ko Win Kyaw',   CURRENT_DATE,              NOW()-INTERVAL'9 hours',  NOW()-INTERVAL'2 hours','present', NOW()),
  ('a1000000-0000-0000-0000-000000000005','Ma Aye Myat',   CURRENT_DATE,              NOW()-INTERVAL'7.5 hours',NULL,                   'late',    NOW()),
  ('a1000000-0000-0000-0000-000000000006','Ko Thiha',      CURRENT_DATE - INTERVAL'1 day', NOW()-INTERVAL'31 hours', NOW()-INTERVAL'23 hours','present', NOW()),
  ('a1000000-0000-0000-0000-000000000007','Ma Thida Soe',  CURRENT_DATE - INTERVAL'1 day', NOW()-INTERVAL'32 hours', NOW()-INTERVAL'24 hours','present', NOW()),
  ('a1000000-0000-0000-0000-000000000008','Ko Min Thura',  CURRENT_DATE - INTERVAL'1 day', NULL, NULL, 'absent', NOW()),
  ('a1000000-0000-0000-0000-000000000009','Ko Aung Kyaw',  CURRENT_DATE - INTERVAL'2 days',NOW()-INTERVAL'55 hours', NOW()-INTERVAL'47 hours','present', NOW()),
  ('a1000000-0000-0000-0000-000000000010','Ma Sandar Win', CURRENT_DATE - INTERVAL'2 days',NOW()-INTERVAL'56 hours', NOW()-INTERVAL'48 hours','present', NOW())
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- 7. LEAVE REQUESTS
-- -------------------------------------------------------
INSERT INTO public.leave_requests (id, employee_name, leave_type, start_date, end_date, reason, status, created_at, updated_at)
VALUES
  ('l1000000-0000-0000-0000-000000000001','Ko Zaw Linn',   'Annual',   CURRENT_DATE+3,  CURRENT_DATE+5,  'Family trip',             'pending',  NOW()-INTERVAL'2 days', NOW()),
  ('l1000000-0000-0000-0000-000000000002','Ma Aye Myat',   'Sick',     CURRENT_DATE+1,  CURRENT_DATE+2,  'Medical appointment',     'pending',  NOW()-INTERVAL'1 day',  NOW()),
  ('l1000000-0000-0000-0000-000000000003','Ko Htet Aung',  'Annual',   CURRENT_DATE+10, CURRENT_DATE+14, 'Vacation to Bagan',       'approved', NOW()-INTERVAL'5 days', NOW()),
  ('l1000000-0000-0000-0000-000000000004','Ko Pyae Sone',  'Emergency','2026-04-18',    '2026-04-18',    'Family emergency',        'approved', NOW()-INTERVAL'3 days', NOW()),
  ('l1000000-0000-0000-0000-000000000005','Ma Thida Soe',  'Sick',     CURRENT_DATE-1,  CURRENT_DATE,    'Fever and flu',           'approved', NOW()-INTERVAL'2 days', NOW()),
  ('l1000000-0000-0000-0000-000000000006','Ko Min Thura',  'Annual',   CURRENT_DATE+7,  CURRENT_DATE+9,  'Personal matter',         'rejected', NOW()-INTERVAL'4 days', NOW()),
  ('l1000000-0000-0000-0000-000000000007','Ko Thiha',      'Maternity','2026-05-01',    '2026-07-31',    'Paternity leave',         'pending',  NOW()-INTERVAL'1 day',  NOW()),
  ('l1000000-0000-0000-0000-000000000008','Ma Sandar Win', 'Sick',     CURRENT_DATE+2,  CURRENT_DATE+3,  'Dental surgery recovery', 'pending',  NOW()-INTERVAL'12 hours', NOW())
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- 8. COD COLLECTIONS
-- -------------------------------------------------------
INSERT INTO public.cod_collections (id, driver_name, shipment_id, amount, status, collected_at, remitted_at, created_at)
VALUES
  ('co1000000-0000-0000-0000-000000000001','Ko Zaw Linn',  's1000000-0000-0000-0000-000000000001', 15000, 'remitted',  NOW()-INTERVAL'10 days', NOW()-INTERVAL'9 days',  NOW()),
  ('co1000000-0000-0000-0000-000000000002','Ko Htet Aung', 's1000000-0000-0000-0000-000000000002',  8000, 'remitted',  NOW()-INTERVAL'9 days',  NOW()-INTERVAL'8 days',  NOW()),
  ('co1000000-0000-0000-0000-000000000003','Ko Pyae Sone', 's1000000-0000-0000-0000-000000000004', 12000, 'remitted',  NOW()-INTERVAL'7 days',  NOW()-INTERVAL'6 days',  NOW()),
  ('co1000000-0000-0000-0000-000000000004','Ko Win Kyaw',  's1000000-0000-0000-0000-000000000008',  9500, 'remitted',  NOW()-INTERVAL'3 days',  NOW()-INTERVAL'2 days',  NOW()),
  ('co1000000-0000-0000-0000-000000000005','Ko Zaw Linn',  's1000000-0000-0000-0000-000000000009',     0, 'remitted',  NOW()-INTERVAL'3 days',  NOW()-INTERVAL'2 days',  NOW()),
  ('co1000000-0000-0000-0000-000000000006','Ko Htet Aung', 's1000000-0000-0000-0000-000000000014',  7500, 'remitted',  NOW()-INTERVAL'1 day',   NOW()-INTERVAL'12 hours',NOW()),
  ('co1000000-0000-0000-0000-000000000007','Ko Pyae Sone', 's1000000-0000-0000-0000-000000000015',  5000, 'collected', NOW()-INTERVAL'12 hours',NULL,                    NOW()),
  ('co1000000-0000-0000-0000-000000000008','Ko Win Kyaw',  's1000000-0000-0000-0000-000000000013', 16000, 'collected', NOW()-INTERVAL'6 hours', NULL,                    NOW()),
  ('co1000000-0000-0000-0000-000000000009','Ko Thiha',     's1000000-0000-0000-0000-000000000017', 11000, 'pending',   NULL,                    NULL,                    NOW()),
  ('co1000000-0000-0000-0000-000000000010','Ko Aung Kyaw', 's1000000-0000-0000-0000-000000000016', 28000, 'pending',   NULL,                    NULL,                    NOW()),
  ('co1000000-0000-0000-0000-000000000011','Ko Min Thura', 's1000000-0000-0000-0000-000000000018', 19500, 'pending',   NULL,                    NULL,                    NOW()),
  ('co1000000-0000-0000-0000-000000000012','Ko Zaw Linn',  's1000000-0000-0000-0000-000000000020', 13500, 'pending',   NULL,                    NULL,                    NOW())
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- 9. INVOICES
-- -------------------------------------------------------
INSERT INTO public.invoices (id, invoice_number, merchant_name, amount, status, due_date, issued_date, created_at, updated_at)
VALUES
  ('i1000000-0000-0000-0000-000000000001','INV-2026-0001','Aung Thu Shop',       125000, 'paid',     '2026-04-01', '2026-03-25', NOW()-INTERVAL'22 days', NOW()),
  ('i1000000-0000-0000-0000-000000000002','INV-2026-0002','Thin Thin Store',      87500, 'paid',     '2026-04-05', '2026-03-29', NOW()-INTERVAL'18 days', NOW()),
  ('i1000000-0000-0000-0000-000000000003','INV-2026-0003','Kyaw Electronics',    245000, 'paid',     '2026-04-10', '2026-04-03', NOW()-INTERVAL'14 days', NOW()),
  ('i1000000-0000-0000-0000-000000000004','INV-2026-0004','Online Fashion',       63000, 'pending',  '2026-04-20', '2026-04-10', NOW()-INTERVAL'7 days',  NOW()),
  ('i1000000-0000-0000-0000-000000000005','INV-2026-0005','Tech Hub Myanmar',    312000, 'pending',  '2026-04-22', '2026-04-12', NOW()-INTERVAL'5 days',  NOW()),
  ('i1000000-0000-0000-0000-000000000006','INV-2026-0006','Shwe Yatha Gems',     180000, 'pending',  '2026-04-25', '2026-04-15', NOW()-INTERVAL'2 days',  NOW()),
  ('i1000000-0000-0000-0000-000000000007','INV-2026-0007','Cool Gadgets',         95000, 'overdue',  '2026-04-10', '2026-04-01', NOW()-INTERVAL'16 days', NOW()),
  ('i1000000-0000-0000-0000-000000000008','INV-2026-0008','Bloom Beauty',         41000, 'overdue',  '2026-04-08', '2026-03-30', NOW()-INTERVAL'18 days', NOW()),
  ('i1000000-0000-0000-0000-000000000009','INV-2026-0009','Golden Star Market',  158000, 'pending',  '2026-04-28', '2026-04-17', NOW()-INTERVAL'0 days',  NOW()),
  ('i1000000-0000-0000-0000-000000000010','INV-2026-0010','MegaMart Online',     425000, 'pending',  '2026-04-30', '2026-04-17', NOW(),                   NOW())
ON CONFLICT (id) DO NOTHING;
