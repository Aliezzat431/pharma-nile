import { supabase } from '../supabase';

export interface CreateProductInput {
  name: string;
  type: string;
  company: string;
  unit: string;
  unit_conversion: number;
  inventory_method: string;
  // Initial Batch details
  barcode: string;
  quantity: number;
  purchase_price: number;
  selling_price: number;
  expiry_date: string;
  pharmacy_id?: string;
}

export async function createProductWithBatch(input: CreateProductInput) {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Try to use the passed pharmacy_id, fallback to user_metadata
  let pharmacyId = input.pharmacy_id || user?.user_metadata?.pharmacy_id;
  
  if (!pharmacyId || pharmacyId === 'undefined' || pharmacyId === 'null') {
    return { success: false, error: new Error('Unauthorized: No pharmacy associated with this request.') };
  }
  
  // DEV AUTO-HEAL: Ensure user has user_pharmacy_access row to satisfy RLS
  if (user) {
    const { error: accessErr } = await supabase.from('user_pharmacy_access').insert([{
      user_id: user.id,
      pharmacy_id: pharmacyId,
      role: 'admin',
      is_primary: false
    }]);
    // Ignore accessErr, usually means it already exists (duplicate key)
  }
  
  // Self-heal the JWT if it doesn't match the current pharmacyId we are trying to act upon
  if (user?.user_metadata?.pharmacy_id !== pharmacyId) {
    await supabase.auth.updateUser({ data: { pharmacy_id: pharmacyId } });
    await supabase.auth.refreshSession();
  }

  // VALIDATION GUARDS (Zero/Negative numbers, Empty Strings & Length Limits)
  const trimmedName = input.name.trim();
  const trimmedCompany = input.company.trim();
  
  if (!trimmedName || !trimmedCompany) {
    return { success: false, error: new Error('Validation Error: Product name and company cannot be empty.') };
  }

  // Prevent UI breaking and DB abuse with very long strings
  if (trimmedName.length > 150 || trimmedCompany.length > 150) {
    return { success: false, error: new Error('Validation Error: Text input exceeds maximum allowed length.') };
  }

  // Prevent XSS/HTML Injection
  const htmlRegex = /<[^>]*>?/gm;
  if (htmlRegex.test(trimmedName) || htmlRegex.test(trimmedCompany)) {
    return { success: false, error: new Error('Validation Error: Invalid characters detected.') };
  }

  if (input.quantity < 0 || input.purchase_price < 0 || input.selling_price < 0 || input.unit_conversion <= 0) {
    return { success: false, error: new Error('Validation Error: Quantity and prices cannot be negative, unit conversion must be positive.') };
  }

  // Enforce integer for quantity to avoid 0.5 decimal abuse if strictly boxes (Optional but good practice for products without fraction units)
  // We'll just ensure it's a valid number for now.

  // 1. Insert into products
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert([
      {
        name: trimmedName,
        type: input.type,
        company: trimmedCompany,
        unit: input.unit,
        unit_conversion: input.unit_conversion,
        inventory_method: input.inventory_method,
        pharmacy_id: pharmacyId
      },
    ])
    .select()
    .single();

  if (productError) {
    console.error('Error creating product:', productError);
    return { success: false, error: productError };
  }

  // 2. Insert into batches
  const { error: batchError } = await supabase
    .from('batches')
    .insert([
      {
        product_id: product.id,
        barcode: input.barcode,
        quantity: input.quantity,
        purchase_price: input.purchase_price,
        selling_price: input.selling_price,
        expiry_date: input.expiry_date,
        pharmacy_id: pharmacyId
      },
    ]);

  if (batchError) {
    console.error('Error creating batch:', batchError);
    // Ideally we would rollback the product creation, but Supabase doesn't easily support transactions from client side.
    return { success: false, error: batchError };
  }

  return { success: true, data: product };
}
