-- =========================================================================
-- PHARMANILE - FIX BULK IMPORT RPC FUNCTION (QUANTITY SET TO 0)
-- Run this script in your Supabase Dashboard SQL Editor
-- =========================================================================

-- 1. Drop existing function to avoid query signature mismatches
DROP FUNCTION IF EXISTS bulk_import_inventory(uuid, text, jsonb);

-- 2. Create the updated function with quantity set to 0 (unit_quantity used ONLY for unit_conversion)
CREATE OR REPLACE FUNCTION bulk_import_inventory(
  p_pharmacy_id uuid,
  p_category text,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item jsonb;
  v_product_id uuid;
  v_count int := 0;
  v_errors jsonb := '[]'::jsonb;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    BEGIN
      -- 1. Upsert Product with dynamic Type and Unit Conversion
      -- NOTE: products table has no updated_at column
      INSERT INTO products (
        pharmacy_id, 
        name, 
        barcode, 
        company_name, 
        price, 
        category, 
        type, 
        unit_conversion
      )
      VALUES (
        p_pharmacy_id,
        trim(v_item->>'name'),
        trim(v_item->>'barcode'),
        trim(COALESCE(v_item->>'company', 'غير محدد')),
        COALESCE((v_item->>'sale_price')::numeric, (v_item->>'selling_price')::numeric, 0),
        p_category,
        COALESCE(v_item->>'type', 'tablet'),
        COALESCE((v_item->>'unit_quantity')::int, 1) -- unit_quantity determines conversion ratio (box -> strip)
      )
      ON CONFLICT (pharmacy_id, barcode) DO UPDATE SET
        name          = EXCLUDED.name,
        company_name  = EXCLUDED.company_name,
        price         = EXCLUDED.price,
        category      = EXCLUDED.category,
        type          = EXCLUDED.type,
        unit_conversion = EXCLUDED.unit_conversion
      RETURNING id INTO v_product_id;

      -- 2. Insert Batch (represented with 0 initial quantity since file has no stock quantity info)
      INSERT INTO batches (
        product_id,
        pharmacy_id,
        barcode,
        batch_number,
        quantity,
        expiry_date,
        purchase_price,
        sale_price
      )
      VALUES (
        v_product_id,
        p_pharmacy_id,
        trim(v_item->>'barcode'),
        'IMP-' || upper(substring(md5(random()::text), 1, 8)),
        0, -- Set initial quantity to 0 (conversion maps to unit_conversion, not quantity)
        NULLIF(trim(COALESCE(v_item->>'expiry_date', '')), '')::date,
        COALESCE((v_item->>'purchase_price')::numeric, 0),
        COALESCE((v_item->>'sale_price')::numeric, (v_item->>'selling_price')::numeric, 0)
      );

      v_count := v_count + 1;

    EXCEPTION WHEN OTHERS THEN
      -- Log errors and keep processing other items
      v_errors := v_errors || jsonb_build_object(
        'item', COALESCE(v_item->>'name', 'unknown'),
        'barcode', COALESCE(v_item->>'barcode', 'unknown'),
        'error', SQLERRM
      );
    END;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'count', v_count, 'errors', v_errors);
END;
$$;

-- 3. Grant execute privileges to authenticated users
GRANT EXECUTE ON FUNCTION bulk_import_inventory(uuid, text, jsonb) TO authenticated;
