-- ==============================================
-- savta_yoel - Seed Data (migrated from Lovable)
-- Run this in Supabase SQL Editor AFTER init-schema.sql
-- ==============================================

-- products (must be inserted before orders due to item references)
insert into public.products (id, name, price, image_url, category, inventory, available, max_quantity_per_order, description, display_order, created_at, updated_at) values
('848b6db9-f147-47aa-9e10-e4b9a019f30c', 'קראנץ שמרים', 52.00, 'https://base44.app/api/apps/690fb9cc6b409680eba43f7b/files/public/690fb9cc6b409680eba43f7b/3e6c70c8c_1000119933.jpg', 'קינוחים', 0, true, 10, null, 1, '2025-12-04 17:43:56.86503+00', '2025-12-04 17:43:56.86503+00'),
('b607777f-8b64-45c8-adb3-6d420bc1f877', 'רביעיית עוגיות שוקלד צ''יפס', 18.00, 'https://base44.app/api/apps/690fb9cc6b409680eba43f7b/files/public/690fb9cc6b409680eba43f7b/f1f3e9eae_CCK.jpg', 'קינוחים', 0, true, 10, null, 2, '2025-12-04 17:43:56.86503+00', '2025-12-04 17:43:56.86503+00'),
('5b9a085e-858e-492c-9e2b-c2ce768a7a8f', 'קפוצ''ינו בינוני', 12.00, 'https://base44.app/api/apps/690fb9cc6b409680eba43f7b/files/public/690fb9cc6b409680eba43f7b/c7b9d2306_1000119770.jpg', 'שתייה', 0, true, 10, null, 3, '2025-12-04 17:43:56.86503+00', '2025-12-04 17:43:56.86503+00'),
('270faeb0-c6ec-490c-acfa-d59f18ca0d96', 'עוגת תפוחים קלאסית', 46.00, 'https://base44.app/api/apps/690fb9cc6b409680eba43f7b/files/public/690fb9cc6b409680eba43f7b/815700d9c_1000119941.jpg', 'קינוחים', 0, true, 10, null, 4, '2025-12-04 17:43:56.86503+00', '2025-12-04 17:43:56.86503+00'),
('3376640a-a6e1-484d-814b-172d0a9ae0c8', 'קופסת עוגיות טחינה', 20.00, 'https://base44.app/api/apps/690fb9cc6b409680eba43f7b/files/public/690fb9cc6b409680eba43f7b/8ca3e4bd0_1000119940.jpg', 'קינוחים', 0, true, 10, null, 5, '2025-12-04 17:43:56.86503+00', '2025-12-04 17:43:56.86503+00'),
('9145e1ed-dad7-4adf-88fd-aa01a7ca7ba5', 'עוגת גבינה אפויה', 36.00, 'https://base44.app/api/apps/690fb9cc6b409680eba43f7b/files/public/690fb9cc6b409680eba43f7b/acd31323f_1000119939.jpg', 'קינוחים', 0, true, 5, null, 6, '2025-12-04 17:43:56.86503+00', '2025-12-04 17:43:56.86503+00');

-- articles
insert into public.articles (id, title, url, source, publication_date, image_url, snippet, display_order, created_at, updated_at) values
('a2c68901-1ad1-499c-8986-e179946e2c87', 'בין ההרים והעמקים - קפה שמרגיש בית', 'https://savtayoel.lovable.app', 'עיתון העמק הוא חלום', '2023-02-02', null, 'בלב הנוף הפסטורלי של הרי הגלבוע ועמק המעיינות נפתח לאחרונה בית קפה חדש שמביא איתו משהו אחר - קונדטוריית סבתא יואל.', 0, '2025-12-04 17:53:35.31632+00', '2025-12-05 06:16:08.807369+00'),
('dc42d165-f4bb-420e-b380-c62ad710fdf0', 'עוצרים לנשום - קפה שמחבר אתכם לטבע', 'https://savtayoel.base44.app', 'גלגליסט', '2025-11-11', 'https://base44.app/api/apps/690fb9cc6b409680eba43f7b/files/public/690fb9cc6b409680eba43f7b/ee198ca83_TheDesigner.jpg', 'יש מקומות שלא צריך להסביר - פשוט מגיעים ומרגישים. סבתא יואל הוא אחד מהם.', 2, '2025-12-04 17:53:35.31632+00', '2025-12-06 19:41:16.136193+00'),
('b105b43e-33a6-4c4d-b3e8-b1f4468f16a7', 'הסבתא האופה - המקום שבו הזמן עוצר!', 'https://savtayoel.lovable.app', 'ידיעות ראשונות', '2021-05-10', 'https://base44.app/api/apps/690fb9cc6b409680eba43f7b/files/public/690fb9cc6b409680eba43f7b/1e6dda484_Gilb.jpg', 'יש מקומות שמציעים קפה טוב, ויש מקומות שמציעים רגע של שקט. קפה סבתא יואל הוא הרבה יותר מזה.', 3, '2025-12-04 17:53:35.31632+00', '2025-12-05 06:16:25.460037+00'),
('2e930600-0044-4359-83fe-ced292762294', 'בין שתיים לשלוש כוסות קפה ביום זה בריא – בלי סוכר כמובן', 'https://new.huji.ac.il/', 'האוניברסיטה העברית', '2021-10-20', 'https://base44.app/api/apps/690fb9cc6b409680eba43f7b/files/public/690fb9cc6b409680eba43f7b/6b95fdb4a_coffe_by_mike_kenneally_unsplash.jpg', 'אז האם המדינה תחליט שהחסרונות עולים על היתרונות ותטיל מס על קפה כדי שאנשים יצרכו אותו פחות?', 4, '2025-12-04 17:53:35.31632+00', '2025-12-04 17:53:35.31632+00');

-- customers (must be inserted before orders due to FK)
insert into public.customers (id, phone, name, total_orders_count, total_spent_amount, last_order_date, product_purchase_history, created_at, updated_at) values
('9e4e5d67-5203-4314-bb92-90d32edc28d7', '0603789632', '4242', 1, 36.00, '2025-12-04 23:15:27.980743+00', '[]', '2025-12-04 23:15:27.980743+00', '2025-12-04 23:15:27.980743+00'),
('d5c222a2-543a-4be3-8d4c-3a9450ca9118', '0632145455', 'רגיב', 1, 146.00, '2025-12-05 05:57:30.063211+00', '[]', '2025-12-05 05:57:30.063211+00', '2025-12-05 05:57:30.063211+00'),
('04219d3e-f230-4159-b9ab-39acf6593dbe', '0509632144', '🗞', 1, 266.00, '2025-12-07 18:01:43.433992+00', '[]', '2025-12-07 18:01:43.433992+00', '2025-12-07 18:01:43.433992+00'),
('3e203162-a512-48e1-b8ce-540ca76cabb4', '0501234567', 'יוחאי', 2, 158.00, '2026-01-12 11:58:39.905003+00', '[]', '2025-12-05 06:13:36.78813+00', '2026-01-12 11:58:39.905003+00'),
('091b2afd-7710-47af-af58-f6cd439c1754', '0508969666', 'Ragin', 1, 348.00, '2026-03-08 13:36:36.560533+00', '[]', '2026-03-08 13:36:36.560533+00', '2026-03-08 13:36:36.560533+00');

-- orders
insert into public.orders (id, customer_id, customer_name, customer_phone, items, total_amount, status, payment_status, notes, admin_notes, is_preparation_counted, created_at, updated_at, tray_layout) values
('7aac0130-00e0-426c-be9d-5a4c863a151d', '9e4e5d67-5203-4314-bb92-90d32edc28d7', '4242', '0603789632', '[{"id":"b607777f-8b64-45c8-adb3-6d420bc1f877","name":"רביעיית עוגיות שוקלד צ''יפס","price":18,"quantity":2}]', 36.00, 'pending', 'unpaid', null, null, false, '2025-12-04 23:15:27.980743+00', '2025-12-04 23:15:27.980743+00', null),
('3d75b20a-3e49-4458-8ea5-b016e84af9af', 'd5c222a2-543a-4be3-8d4c-3a9450ca9118', 'רגיב', '0632145455', '[{"id":"3376640a-a6e1-484d-814b-172d0a9ae0c8","name":"קופסת עוגיות טחינה","price":20,"quantity":5},{"id":"270faeb0-c6ec-490c-acfa-d59f18ca0d96","name":"עוגת תפוחים קלאסית","price":46,"quantity":1}]', 146.00, 'pending', 'unpaid', null, null, false, '2025-12-05 05:57:30.063211+00', '2025-12-05 05:57:30.063211+00', null),
('4ec5df92-8095-435a-82eb-9cb95b7e556f', '3e203162-a512-48e1-b8ce-540ca76cabb4', 'Huli', '0501234567', '[{"id":"848b6db9-f147-47aa-9e10-e4b9a019f30c","name":"קראנץ שמרים","price":52,"quantity":1},{"id":"b607777f-8b64-45c8-adb3-6d420bc1f877","name":"רביעיית עוגיות שוקלד צ''יפס","price":18,"quantity":1}]', 70.00, 'pending', 'unpaid', null, null, false, '2025-12-05 06:13:36.78813+00', '2025-12-05 06:13:36.78813+00', null),
('663bf119-3e80-4782-89a0-13dfd22fb1bf', '04219d3e-f230-4159-b9ab-39acf6593dbe', '🗞', '0509632144', '[{"id":"3376640a-a6e1-484d-814b-172d0a9ae0c8","name":"קופסת עוגיות טחינה","price":20,"quantity":1},{"id":"5b9a085e-858e-492c-9e2b-c2ce768a7a8f","name":"קפוצ''ינו בינוני","price":12,"quantity":2},{"id":"270faeb0-c6ec-490c-acfa-d59f18ca0d96","name":"עוגת תפוחים קלאסית","price":46,"quantity":1},{"id":"9145e1ed-dad7-4adf-88fd-aa01a7ca7ba5","name":"עוגת גבינה אפויה","price":36,"quantity":2},{"id":"848b6db9-f147-47aa-9e10-e4b9a019f30c","name":"קראנץ שמרים","price":52,"quantity":2}]', 266.00, 'pending', 'unpaid', ',לא', null, false, '2025-12-07 18:01:43.433992+00', '2025-12-07 18:01:43.433992+00', null),
('98b0867c-6313-4a5e-bfad-b0f58912a3f1', '3e203162-a512-48e1-b8ce-540ca76cabb4', 'יוחאי', '0501234567', '[{"id":"b607777f-8b64-45c8-adb3-6d420bc1f877","name":"רביעיית עוגיות שוקלד צ''יפס","price":18,"quantity":2},{"id":"848b6db9-f147-47aa-9e10-e4b9a019f30c","name":"קראנץ שמרים","price":52,"quantity":1}]', 88.00, 'pending', 'unpaid', null, null, false, '2026-01-12 11:58:39.905003+00', '2026-01-12 11:58:39.905003+00', null),
('f1a3f22f-8eaa-4bf8-b79c-87f0043c85ef', '091b2afd-7710-47af-af58-f6cd439c1754', 'Ragin', '0508969666', '[{"id":"848b6db9-f147-47aa-9e10-e4b9a019f30c","name":"קראנץ שמרים","price":52,"quantity":3},{"id":"9145e1ed-dad7-4adf-88fd-aa01a7ca7ba5","name":"עוגת גבינה אפויה","price":36,"quantity":3},{"id":"270faeb0-c6ec-490c-acfa-d59f18ca0d96","name":"עוגת תפוחים קלאסית","price":46,"quantity":1},{"id":"b607777f-8b64-45c8-adb3-6d420bc1f877","name":"רביעיית עוגיות שוקלד צ''יפס","price":18,"quantity":1},{"id":"3376640a-a6e1-484d-814b-172d0a9ae0c8","name":"קופסת עוגיות טחינה","price":20,"quantity":1}]', 348.00, 'pending', 'unpaid', null, null, false, '2026-03-08 13:36:36.560533+00', '2026-03-08 13:36:36.560533+00', null);

-- settings
insert into public.settings (id, key, value, created_at, updated_at) values
('5afaa11c-669b-4d28-8192-ff7533880e4f', 'business_name', '"קונדטוריית סבתא יואל"', '2025-12-04 17:53:49.458679+00', '2025-12-06 19:58:14.350496+00'),
('ad5c1b10-0376-47ca-9cee-d33885c643ec', 'business_slogan', '"מקום קטן עם טעמים גדולים - קפה שמרגיש בית"', '2025-12-04 17:53:49.458679+00', '2025-12-06 19:58:14.510679+00'),
('0acb9bea-864c-4274-ac52-078ed3b747f5', 'contact_person_name', '"יואש.ג"', '2025-12-04 17:53:49.458679+00', '2025-12-06 19:58:14.636948+00'),
('1ab91865-535c-49e7-b57a-d1fb86dcf625', 'contact_phone', '"0508272844"', '2025-12-04 17:53:49.458679+00', '2025-12-06 19:58:14.765561+00'),
('3edc4800-0fbf-4e7d-9a7f-1adcc4f380d7', 'menu_description', '"מנות העונה"', '2025-12-04 17:53:49.458679+00', '2025-12-06 19:58:14.895894+00'),
('31652cd4-1dc5-4ef7-873a-9e78a8710e86', 'logo_url', '"https://base44.app/api/apps/690fb9cc6b409680eba43f7b/files/public/690fb9cc6b409680eba43f7b/f945987c7_1000119895.png"', '2025-12-04 17:53:49.458679+00', '2025-12-06 19:58:15.00645+00'),
('cdb60a07-eafa-4d76-9131-d389cde51086', 'weekly_ordering_schedule', '{"0":{"always_open":false,"enabled":true,"end":"10:00","start":"06:00"},"1":{"always_open":false,"enabled":true,"end":"15:00","start":"10:00"},"2":{"always_open":false,"enabled":true,"end":"15:00","start":"10:00"},"3":{"always_open":true,"enabled":true,"end":"16:00","start":"09:00"},"4":{"always_open":true,"enabled":true,"end":"16:00","start":"09:00"},"5":{"always_open":false,"enabled":true,"end":"10:00","start":"06:00"},"6":{"always_open":true,"enabled":false,"end":"00:00","start":"00:00"}}', '2025-12-04 17:53:49.458679+00', '2025-12-06 19:58:15.136264+00'),
('7e3be677-a33b-46df-92e4-1ebed7bd70ab', 'primary_color', '"#240000"', '2025-12-04 17:53:49.458679+00', '2025-12-06 19:58:15.359773+00'),
('8f20db74-4aab-4310-accf-182c7a112bc5', 'business_address', '"העמק הקסום"', '2025-12-04 17:53:49.458679+00', '2025-12-06 19:58:15.473309+00'),
('3016b2c6-3f48-4484-bfc3-06471a2daa04', 'hero_section_text', '"בית קפה כפרי בלב הנוף של הרים תנכיים ונביעות טבעיות, המשלב אווירה חמה עם חומרי גלם מקומיים ותפריט עונתי. המקום מציע קפה איכותי, מאפים טריים וחוויית אירוח שמרגישה כמו בית מול הנוף הכי יפה בארץ!"', '2025-12-04 17:53:49.458679+00', '2025-12-06 19:58:15.583564+00'),
('618de1ce-8ae6-43c8-9071-f7e445a54cd4', 'hero_image_url', '"https://base44.app/api/apps/690fb9cc6b409680eba43f7b/files/public/690fb9cc6b409680eba43f7b/0fa92a123_1000119949.jpg"', '2025-12-04 17:53:49.458679+00', '2025-12-06 19:58:15.695581+00'),
('4ece4563-e4e2-42c5-b0c6-773d05c9d8b2', 'paybox_url', '"https://www.payboxapp.com/"', '2025-12-04 17:53:49.458679+00', '2025-12-06 19:58:15.802844+00'),
('1783cde6-8fea-41a9-9fb7-330bb9d1f494', 'bit_enabled', 'true', '2025-12-04 17:53:49.458679+00', '2025-12-06 19:58:15.915814+00'),
('041d0b7e-783e-4ae2-80d1-6fd90f0b490d', 'bit_payment_url', '"https://www.bitpay.co.il/"', '2025-12-04 17:53:49.458679+00', '2025-12-06 19:58:16.032277+00'),
('d6da7c62-2820-4515-a628-bec79b58f6d1', 'site_enabled', 'true', '2025-12-04 17:53:49.458679+00', '2025-12-06 19:58:16.134705+00'),
('4fc2b0f0-b60c-4df0-869d-7bf601d60954', 'footer_section_text', '"בית קפה כפרי בלב הנוף של הרי הגלבוע"', '2025-12-04 17:53:49.458679+00', '2026-02-09 12:35:46.11739+00');

-- user_roles
insert into public.user_roles (id, user_id, role, created_at) values
('3a13ae37-e3b3-46e6-84c2-89a948d94816', 'd551c12e-5d19-4d59-b733-c1f845c8d42b', 'admin', '2025-12-05 05:51:55.214597+00');
