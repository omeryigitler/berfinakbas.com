-- Ten deterministic reference clients used to validate the Hub design and deletion flow.
-- They are inserted once by Prisma migrate deploy and are not recreated after deletion.

INSERT INTO "clients" (
  "id",
  "type",
  "first_name",
  "last_name",
  "preferred_name",
  "phone",
  "email",
  "birth_year",
  "status",
  "created_at",
  "updated_at",
  "email_normalized",
  "phone_normalized"
)
VALUES
  ('10000000-0000-4000-8000-000000000001', 'ADULT', 'Ece', 'Yılmaz', NULL, '+90 532 100 10 01', 'ece.yilmaz@reference.berfinakbas.test', 1992, 'ACTIVE', NOW() - INTERVAL '120 days', NOW() - INTERVAL '45 minutes', 'ece.yilmaz@reference.berfinakbas.test', '905321001001'),
  ('10000000-0000-4000-8000-000000000002', 'ADULT', 'Mert', 'Kaya', NULL, '+90 532 100 10 02', 'mert.kaya@reference.berfinakbas.test', 1988, 'PROSPECTIVE', NOW() - INTERVAL '35 days', NOW() - INTERVAL '3 hours', 'mert.kaya@reference.berfinakbas.test', '905321001002'),
  ('10000000-0000-4000-8000-000000000003', 'ADULT', 'Selin', 'Arslan', 'Selin', '+90 532 100 10 03', 'selin.arslan@reference.berfinakbas.test', 1995, 'ACTIVE', NOW() - INTERVAL '90 days', NOW() - INTERVAL '1 day', 'selin.arslan@reference.berfinakbas.test', '905321001003'),
  ('10000000-0000-4000-8000-000000000004', 'ADULT', 'Can', 'Demir', NULL, '+90 532 100 10 04', 'can.demir@reference.berfinakbas.test', 1984, 'INACTIVE', NOW() - INTERVAL '180 days', NOW() - INTERVAL '2 days', 'can.demir@reference.berfinakbas.test', '905321001004'),
  ('10000000-0000-4000-8000-000000000005', 'CHILD', 'Zeynep', 'Çelik', NULL, NULL, NULL, 2018, 'PROSPECTIVE', NOW() - INTERVAL '14 days', NOW() - INTERVAL '4 hours', NULL, NULL),
  ('10000000-0000-4000-8000-000000000006', 'CHILD', 'Kerem', 'Aydın', NULL, NULL, NULL, 2017, 'ACTIVE', NOW() - INTERVAL '75 days', NOW() - INTERVAL '20 hours', NULL, NULL),
  ('10000000-0000-4000-8000-000000000007', 'CHILD', 'Duru', 'Şahin', NULL, NULL, NULL, 2019, 'ACTIVE', NOW() - INTERVAL '55 days', NOW() - INTERVAL '5 days', NULL, NULL),
  ('10000000-0000-4000-8000-000000000008', 'ADULT', 'Burak', 'Koç', NULL, '+90 532 100 10 08', 'burak.koc@reference.berfinakbas.test', 1990, 'PROSPECTIVE', NOW() - INTERVAL '8 days', NOW() - INTERVAL '6 days', 'burak.koc@reference.berfinakbas.test', '905321001008'),
  ('10000000-0000-4000-8000-000000000009', 'ADULT', 'Elif', 'Yıldız', NULL, '+90 532 100 10 09', 'elif.yildiz@reference.berfinakbas.test', 1997, 'ACTIVE', NOW() - INTERVAL '65 days', NOW() - INTERVAL '8 days', 'elif.yildiz@reference.berfinakbas.test', '905321001009'),
  ('10000000-0000-4000-8000-000000000010', 'ADULT', 'Deniz', 'Aksoy', NULL, '+90 532 100 10 10', 'deniz.aksoy@reference.berfinakbas.test', 1986, 'ACTIVE', NOW() - INTERVAL '100 days', NOW() - INTERVAL '15 days', 'deniz.aksoy@reference.berfinakbas.test', '905321001010')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "guardians" (
  "id",
  "first_name",
  "last_name",
  "phone",
  "email",
  "created_at",
  "updated_at",
  "email_normalized",
  "phone_normalized"
)
VALUES
  ('20000000-0000-4000-8000-000000000001', 'Ayşe', 'Çelik', '+90 532 200 20 01', 'ayse.celik@reference.berfinakbas.test', NOW() - INTERVAL '14 days', NOW() - INTERVAL '4 hours', 'ayse.celik@reference.berfinakbas.test', '905322002001'),
  ('20000000-0000-4000-8000-000000000002', 'Emre', 'Aydın', '+90 532 200 20 02', 'emre.aydin@reference.berfinakbas.test', NOW() - INTERVAL '75 days', NOW() - INTERVAL '20 hours', 'emre.aydin@reference.berfinakbas.test', '905322002002'),
  ('20000000-0000-4000-8000-000000000003', 'Melis', 'Şahin', '+90 532 200 20 03', 'melis.sahin@reference.berfinakbas.test', NOW() - INTERVAL '55 days', NOW() - INTERVAL '5 days', 'melis.sahin@reference.berfinakbas.test', '905322002003')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "client_guardians" (
  "client_id",
  "guardian_id",
  "relationship",
  "is_primary"
)
VALUES
  ('10000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000001', 'Annesi', TRUE),
  ('10000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000002', 'Babası', TRUE),
  ('10000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000003', 'Annesi', TRUE)
ON CONFLICT ("client_id", "guardian_id") DO NOTHING;
