-- ============================================================
-- PHARMANILE SEED DATA
-- Default base data for pharmacy and settings
-- ============================================================

-- 1. Create default pharmacy (standalone configuration)
INSERT INTO pharmacies (id, name, address, phone, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'صيدلية النيل النموذجية', 'القاهرة، مصر', '0123456789', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create default pharmacy settings
INSERT INTO pharmacy_settings (pharmacy_id, pharmacy_name, inventory_method)
VALUES ('00000000-0000-0000-0000-000000000001', 'صيدلية النيل النموذجية', 'FEFO')
ON CONFLICT (pharmacy_id) DO NOTHING;

-- 3. Core test products and batches
INSERT INTO products (id, pharmacy_id, name, barcode, company_name, price, category) 
VALUES ('fa1df052-90a8-4dec-8bac-f24a3a7a91d6', '00000000-0000-0000-0000-000000000001', 'Avazir', '6224000219499', 'Orchidia', 20.0, 'مستحضرات')
ON CONFLICT (pharmacy_id, barcode) DO NOTHING;

INSERT INTO batches (product_id, pharmacy_id, barcode, batch_number, quantity, expiry_date, purchase_price, sale_price) 
VALUES ('fa1df052-90a8-4dec-8bac-f24a3a7a91d6', '00000000-0000-0000-0000-000000000001', '6224000219499', 'B-9499', 2, '2027-05-17', 16.0, 20.0)
ON CONFLICT DO NOTHING;

INSERT INTO products (id, pharmacy_id, name, barcode, company_name, price, category) 
VALUES ('e5b54e89-9af0-4867-b02c-a8c6db2651d0', '00000000-0000-0000-0000-000000000001', 'Brimillergy', '6223005443366', 'Orchidia', 22.0, 'مستحضرات')
ON CONFLICT (pharmacy_id, barcode) DO NOTHING;

INSERT INTO batches (product_id, pharmacy_id, barcode, batch_number, quantity, expiry_date, purchase_price, sale_price) 
VALUES ('e5b54e89-9af0-4867-b02c-a8c6db2651d0', '00000000-0000-0000-0000-000000000001', '6223005443366', 'B-3366', 2, '2027-11-17', 17.6, 22.0)
ON CONFLICT DO NOTHING;

INSERT INTO products (id, pharmacy_id, name, barcode, company_name, price, category) 
VALUES ('154d37ed-7a2e-45ff-a6ed-8b47229e09ab', '00000000-0000-0000-0000-000000000001', 'Co-Avazir', '6224000219826', 'Orchidia', 39.0, 'مستحضرات')
ON CONFLICT (pharmacy_id, barcode) DO NOTHING;

INSERT INTO batches (product_id, pharmacy_id, barcode, batch_number, quantity, expiry_date, purchase_price, sale_price) 
VALUES ('154d37ed-7a2e-45ff-a6ed-8b47229e09ab', '00000000-0000-0000-0000-000000000001', '6224000219826', 'B-9826', 2, '2027-12-17', 31.2, 39.0)
ON CONFLICT DO NOTHING;

INSERT INTO products (id, pharmacy_id, name, barcode, company_name, price, category) 
VALUES ('ae58a457-be35-4957-a1ec-d7a72e5b5ab7', '00000000-0000-0000-0000-000000000001', 'Conjuclear', '6224000219451', 'Orchidia', 22.0, 'مستحضرات')
ON CONFLICT (pharmacy_id, barcode) DO NOTHING;

INSERT INTO batches (product_id, pharmacy_id, barcode, batch_number, quantity, expiry_date, purchase_price, sale_price) 
VALUES ('ae58a457-be35-4957-a1ec-d7a72e5b5ab7', '00000000-0000-0000-0000-000000000001', '6224000219451', 'B-9451', 2, '2028-01-17', 17.6, 22.0)
ON CONFLICT DO NOTHING;
