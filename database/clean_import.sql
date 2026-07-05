-- =========================================================================
-- PHARMANILE - CLEAN LAST IMPORT (FILLER.TXT)
-- Run this script in your Supabase Dashboard SQL Editor to delete
-- the incorrectly imported products and batches before importing again.
-- =========================================================================

-- Delete products matching barcodes from filler.txt
-- (Batches will be automatically deleted due to ON DELETE CASCADE)
DELETE FROM products 
WHERE barcode IN (
  '6223002971985', -- Adwiflam 25
  '6223002971992', -- Adwiflam 12.5
  '6223003570644', -- Anoxicam
  '6221094034281', -- Baby Relief 12.5
  '6221094000675', -- Baby Relief 25
  '6221151529354', -- Declophen 12.5
  '6221151413608', -- Declophen 100
  '6221077090310', -- Decongestyl-N
  '6221163003439', -- Dolphin-K
  '6221163014756', -- Dolphin 12.5
  '6221163014770', -- Dolphin 50
  '6221163014763', -- Dolphin 25
  '06221032250063', -- Cetal 120
  '6223005461063', -- Faktu
  '6223000011447', -- Glycerin For Infants
  '6223000011638', -- Glycerin For Adults
  '6221045001713', -- Glycerin 738.9 For Infantile
  '6221060001590', -- Indometacin
  '6221094154484', -- H-Formula
  '6221163006003', -- Navoproxin
  '6223004900600', -- Medexaflam
  '06223002149339', -- Soral
  '6223002640898', -- Voltaren 25
  '6223002642151', -- Voltaren 100
  '6221075052600'  -- Oplex-N For Children
);
