// debug-db.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// تحميل متغيرات البيئة من ملف .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Environment Variables. Check your .env.local file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  const pharmacyId = "eb41535f-e35c-428d-96af-130defca3e1e"; // الـ ID اللي ظهرلك

  console.log(`🔍 Checking data for Pharmacy: ${pharmacyId}...`);

  // 1. Check Total Products in DB (Ignoring Pharmacy ID first)
  const { count: totalProducts, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error("❌ Error counting products:", countError.message);
  } else {
    console.log(`📦 Total products in entire DB: ${totalProducts}`);
  }

  // 2. Check Products for THIS Pharmacy
  const { data: myProducts, error: fetchError } = await supabase
    .from('products')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .limit(5);

  if (fetchError) {
    console.error("❌ Error fetching your products:", fetchError.message);
  } else {
    console.log(`✅ Products found for your pharmacy: ${myProducts?.length}`);
    if (myProducts && myProducts.length > 0) {
      console.log("Sample Data:", JSON.stringify(myProducts[0], null, 2));
    } else {
      console.log("⚠️ No products found for this specific Pharmacy ID.");
      console.log("💡 Tip: Check if the pharmacy_id in your database matches the one above.");
    }
  }
}

runTest();