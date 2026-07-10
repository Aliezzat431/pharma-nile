import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';


const PRODUCT_ALIASES: Record<string, string> = {
  
  name: 'name', drug_name: 'name', product_name: 'name', item_name: 'name',
  medicine: 'name', اسم: 'name', اسم_المنتج: 'name',
  
  barcode: 'barcode', bar_code: 'barcode', code: 'barcode', sku: 'barcode',
  
  type: 'type', form: 'type', dosage_form: 'type',
  
  company_name: 'company_name', company: 'company_name', manufacturer: 'company_name',
  brand: 'company_name', الشركة: 'company_name',
  
  price: 'price', sale_price: 'price', selling_price: 'price', selling: 'price',
  category: 'category', class: 'category',
};

const BATCH_ALIASES: Record<string, string> = {
  quantity: 'quantity', qty: 'quantity', stock: 'quantity', الكمية: 'quantity',
  expiry_date: 'expiry_date', expiry: 'expiry_date', exp_date: 'expiry_date',
  exp: 'expiry_date', expire: 'expiry_date', تاريخ_الانتهاء: 'expiry_date',
  purchase_price: 'purchase_price', cost: 'purchase_price', cost_price: 'purchase_price',
  buy_price: 'purchase_price', buying: 'purchase_price',
  sale_price: 'sale_price', selling_price: 'sale_price', price: 'sale_price',
  batch_number: 'batch_number', batch: 'batch_number', lot: 'batch_number',
};

const CUSTOMER_ALIASES: Record<string, string> = {
  name: 'name', customer_name: 'name', client_name: 'name', اسم: 'name',
  phone: 'phone', mobile: 'phone', tel: 'phone', الهاتف: 'phone',
  email: 'email', address: 'address', العنوان: 'address',
  total_debt: 'total_debt', debt: 'total_debt', balance: 'total_debt',
  credit_limit: 'credit_limit',
};

function mapRow(row: Record<string, any>, aliases: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(row)) {
    const mapped = aliases[key.toLowerCase().trim()] ?? aliases[key.trim()];
    if (mapped) result[mapped] = val;
  }
  return result;
}

function normalizeDate(val: any): string | null {
  if (!val) return null;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    
    const authHeader = req.headers.get('Authorization');
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    
    const { data: accessData } = await supabase
      .from('user_pharmacy_access')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .maybeSingle();

    const pharmacyId = accessData?.pharmacy_id;
    if (!pharmacyId) {
      return NextResponse.json(
        { success: false, error: 'لم يتم العثور على صيدلية مرتبطة بحسابك' },
        { status: 401 }
      );
    }

    
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'لم يتم إرفاق الملف' }, { status: 400 });
    }

    let fullData: any;
    try {
      fullData = JSON.parse(await file.text());
    } catch {
      return NextResponse.json({ success: false, error: 'صيغة ملف JSON غير صالحة' }, { status: 400 });
    }

    
    
    
    const payload = fullData?.data ?? fullData;

    
    const findArray = (keys: string[]): any[] | null => {
      for (const k of keys) {
        if (Array.isArray(payload[k])) return payload[k];
      }
      return null;
    };

    const rawProducts  = findArray(['products', 'Products', 'PRODUCTS', 'medicines', 'drugs', 'items']);
    const rawBatches   = findArray(['batches', 'Batches', 'BATCHES', 'stock', 'inventory']);
    const rawCustomers = findArray(['customers', 'Customers', 'CUSTOMERS', 'clients', 'debtors']);

    const stats = { products: 0, batches: 0, customers: 0, errors: [] as string[] };
    const CHUNK = 200;

    
    if (rawProducts && rawProducts.length > 0) {
      for (let i = 0; i < rawProducts.length; i += CHUNK) {
        const chunk = rawProducts.slice(i, i + CHUNK).map((row: any) => {
          const m = mapRow(row, PRODUCT_ALIASES);
          return {
            id: uuidv4(),
            pharmacy_id: pharmacyId,
            name: m.name ?? row.name ?? 'منتج غير معروف',
            barcode: m.barcode ?? row.barcode ?? null,
            type: m.type ?? 'tablet',
            company_name: m.company_name ?? null,
            category: m.category ?? null,
            price: parseFloat(m.price ?? row.price ?? 0) || 0,
          };
        }).filter((r: any) => r.name);

        const { error } = await supabase
          .from('products')
          .upsert(chunk, { onConflict: 'pharmacy_id,barcode', ignoreDuplicates: false });

        if (error) stats.errors.push(`products chunk ${i}: ${error.message}`);
        else stats.products += chunk.length;
      }
    }

    
    if (rawCustomers && rawCustomers.length > 0) {
      for (let i = 0; i < rawCustomers.length; i += CHUNK) {
        const chunk = rawCustomers.slice(i, i + CHUNK).map((row: any) => {
          const m = mapRow(row, CUSTOMER_ALIASES);
          return {
            id: uuidv4(),
            pharmacy_id: pharmacyId,
            name: m.name ?? row.name ?? 'عميل غير معروف',
            phone: m.phone ?? row.phone ?? null,
            email: m.email ?? null,
            address: m.address ?? null,
            total_debt: parseFloat(m.total_debt ?? 0) || 0,
            credit_limit: parseFloat(m.credit_limit ?? 5000) || 5000,
          };
        }).filter((r: any) => r.name);

        const { error } = await supabase
          .from('customers')
          .upsert(chunk, { onConflict: 'pharmacy_id,phone', ignoreDuplicates: false });

        if (error) stats.errors.push(`customers chunk ${i}: ${error.message}`);
        else stats.customers += chunk.length;
      }
    }

    
    if (rawBatches && rawBatches.length > 0) {
      for (let i = 0; i < rawBatches.length; i += CHUNK) {
        const chunk = rawBatches.slice(i, i + CHUNK);

        const enriched = await Promise.all(
          chunk.map(async (row: any) => {
            const m = mapRow(row, BATCH_ALIASES);
            const barcode = row.barcode ?? m.barcode ?? null;

            let productId = row.product_id ?? null;
            if (!productId && barcode) {
              const { data: prod } = await supabase
                .from('products')
                .select('id')
                .eq('pharmacy_id', pharmacyId)
                .eq('barcode', barcode)
                .maybeSingle();
              productId = prod?.id ?? null;
            }

            if (!productId) return null;

            return {
              product_id: productId,
              pharmacy_id: pharmacyId,
              barcode,
              batch_number: m.batch_number ?? `IMP-${Date.now()}`,
              quantity: parseInt(m.quantity ?? row.quantity ?? 0) || 0,
              expiry_date: normalizeDate(m.expiry_date ?? row.expiry_date),
              purchase_price: parseFloat(m.purchase_price ?? 0) || 0,
              sale_price: parseFloat(m.sale_price ?? row.price ?? 0) || 0,
            };
          })
        );

        const valid = enriched.filter((b): b is NonNullable<typeof b> => b !== null);
        if (valid.length > 0) {
          const { error } = await supabase.from('batches').insert(valid);
          if (error) stats.errors.push(`batches chunk ${i}: ${error.message}`);
          else stats.batches += valid.length;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'تم استيراد البيانات بنجاح',
      stats,
    });

  } catch (error: any) {
    console.error('[db-backup/import] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}