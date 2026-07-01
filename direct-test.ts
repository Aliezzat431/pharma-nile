import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PHARMACY_ID = "eb41535f-e35c-428d-96af-130defca3e1e";

async function directCheck() {
    if (!SUPABASE_URL || !SERVICE_KEY) {
        console.error("❌ Missing ENV variables!");
        return;
    }

    console.log("🚀 Directly hitting Supabase REST API...");

    // 1. Check Total Count (No Filter)
    const countRes = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id&limit=1`, {
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Prefer': 'count=exact'
        }
    });

    const countHeader = countRes.headers.get('content-range');
    console.log(`📊 Total Products in DB (Any Pharmacy): ${countHeader ? countHeader.split('/')[1] : 'Error'}`);

    // 2. Check Your Pharmacy Data
    const dataRes = await fetch(`${SUPABASE_URL}/rest/v1/products?pharmacy_id=eq.${PHARMACY_ID}&select=*`, {
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Prefer': 'return=representation'
        }
    });

    if (!dataRes.ok) {
        const err = await dataRes.text();
        console.error("❌ API Error:", err);
    } else {
        const data = await dataRes.json();
        console.log(`✅ Found ${data.length} products for your pharmacy!`);
        if (data.length > 0) console.log("Sample:", data[0]);
    }
}

directCheck();