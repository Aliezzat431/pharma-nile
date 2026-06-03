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
}

export async function createProductWithBatch(input: CreateProductInput) {
  // 1. Insert into products
  const pharmacyId = typeof window !== 'undefined' ? localStorage.getItem('selected_pharmacy_id') : null;
  
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert([
      {
        name: input.name,
        type: input.type,
        company: input.company,
        unit: input.unit,
        unit_conversion: input.unit_conversion,
        inventory_method: input.inventory_method,
        ...(pharmacyId ? { pharmacy_id: pharmacyId } : {})
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
        ...(pharmacyId ? { pharmacy_id: pharmacyId } : {})
      },
    ]);

  if (batchError) {
    console.error('Error creating batch:', batchError);
    // Ideally we would rollback the product creation, but Supabase doesn't easily support transactions from client side.
    return { success: false, error: batchError };
  }

  return { success: true, data: product };
}
