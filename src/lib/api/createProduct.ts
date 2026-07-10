import { supabase } from '../supabase';

















export interface CreateProductInput {
  name: string;
  type: string;
  company: string;
  unit: string;
  unit_conversion: number;
  inventory_method: string;
  barcode: string;
  quantity: number;
  purchase_price: number;
  sale_price: number;
  expiry_date: string;
  
  
}


async function resolvePrimaryPharmacyId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_pharmacy_access')
    .select('pharmacy_id')
    .eq('user_id', userId)          
    .eq('is_primary', true)         
    .maybeSingle();                 

  if (error) {
    console.error('[createProduct] user_pharmacy_access lookup failed:', error.message);
    return null;
  }

  return data?.pharmacy_id ?? null;
}

export async function createProductWithBatch(input: CreateProductInput) {
  
  
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: new Error('Unauthorized: Authentication required.') };
  }

  
  
  
  
  
  
  
  
  
  
  const pharmacyId = await resolvePrimaryPharmacyId(user.id);

  if (!pharmacyId) {
    return {
      success: false,
      error: new Error(
        'Unauthorized: No primary pharmacy linked to this account. ' +
        'Contact your administrator.'
      ),
    };
  }

  
  const trimmedName    = input.name.trim();
  const trimmedCompany = input.company.trim();

  if (!trimmedName || !trimmedCompany) {
    return { success: false, error: new Error('Validation Error: Product name and company cannot be empty.') };
  }

  if (trimmedName.length > 150 || trimmedCompany.length > 150) {
    return { success: false, error: new Error('Validation Error: Text input exceeds maximum allowed length.') };
  }

  const htmlRegex = /<[^>]*>?/gm;
  if (htmlRegex.test(trimmedName) || htmlRegex.test(trimmedCompany)) {
    return { success: false, error: new Error('Validation Error: Invalid characters detected.') };
  }

  if (
    input.quantity < 0 ||
    input.purchase_price < 0 ||
    input.sale_price < 0 ||
    input.unit_conversion <= 0
  ) {
    return {
      success: false,
      error: new Error(
        'Validation Error: Quantity and prices cannot be negative; unit conversion must be positive.'
      ),
    };
  }

  
  
  
  
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert([
      {
        name:             trimmedName,
        type:             input.type,
        company:          trimmedCompany,
        unit:             input.unit,
        unit_conversion:  input.unit_conversion,
        inventory_method: input.inventory_method,
        pharmacy_id:      pharmacyId,   
      },
    ])
    .select()
    .maybeSingle(); 

  if (productError) {
    console.error('[createProduct] Product insert failed:', productError.message);
    return { success: false, error: productError };
  }
  if (!product) {
    return { success: false, error: new Error('فشل إنشاء المنتج — تحقق من الصلاحيات.') };
  }

  
  
  
  const { error: batchError } = await supabase
    .from('batches')
    .insert([
      {
        product_id:     product.id,
        barcode:        input.barcode,
        quantity:       input.quantity,
        purchase_price: input.purchase_price,
        sale_price:     input.sale_price,
        expiry_date:    input.expiry_date,
        pharmacy_id:    pharmacyId,     
      },
    ]);

  if (batchError) {
    console.error('[createProduct] Batch insert failed:', batchError.message);
    
    
    await supabase
      .from('products')
      .delete()
      .eq('id', product.id)
      .eq('pharmacy_id', pharmacyId);
    return { success: false, error: batchError };
  }

  return { success: true, data: product };
}
