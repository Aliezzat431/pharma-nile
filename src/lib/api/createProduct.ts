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
  pharmacy_id?: string;
}

export async function createProductWithBatch(input: CreateProductInput) {
  const { data: { user } } = await supabase.auth.getUser();

  let pharmacyId = input.pharmacy_id || user?.user_metadata?.pharmacy_id;
  
  if (!pharmacyId || pharmacyId === 'undefined' || pharmacyId === 'null') {
    return { success: false, error: new Error('Unauthorized: No pharmacy associated with this request.') };
  }

  if (user) {
    const { error: accessErr } = await supabase.from('user_pharmacy_access').insert([{
      user_id: user.id,
      pharmacy_id: pharmacyId,
      role: 'admin',
      is_primary: false
    }]);

  }

  if (user?.user_metadata?.pharmacy_id !== pharmacyId) {
    await supabase.auth.updateUser({ data: { pharmacy_id: pharmacyId } });
    await supabase.auth.refreshSession();
  }

  const trimmedName = input.name.trim();
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

  if (input.quantity < 0 || input.purchase_price < 0 || input.sale_price < 0 || input.unit_conversion <= 0) {
    return { success: false, error: new Error('Validation Error: Quantity and prices cannot be negative, unit conversion must be positive.') };
  }



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

  const { error: batchError } = await supabase
    .from('batches')
    .insert([
      {
        product_id: product.id,
        barcode: input.barcode,
        quantity: input.quantity,
        purchase_price: input.purchase_price,
        sale_price: input.sale_price,
        expiry_date: input.expiry_date,
        pharmacy_id: pharmacyId
      },
    ]);

  if (batchError) {
    console.error('Error creating batch:', batchError);

    return { success: false, error: batchError };
  }

  return { success: true, data: product };
}

