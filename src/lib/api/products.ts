import { supabase } from '../supabase';

export interface Product {
  id: string;
  name: string;
  type: string;
  unit: string;
  unit_conversion: number;
  company_id: string;
  inventory_method: string;
  // Computed fields from the view if we rely on it, otherwise null initially
  total_quantity?: number;
  current_price?: number;
  company?: string;
  barcode?: string;
  activeBatches?: any[]; // added to hold batch distributions options
}

export interface Batch {
  id: string;
  product_id: string;
  barcode: string;
  quantity: number;
  purchase_price: number;
  selling_price: number;
  expiry_date: string;
}

// Fetch all products with their active batches and computed prices
export async function searchProducts(query: string) {
  // Using a simple ilike search on the product name or barcode lookup
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      *,
      batches (
        *
      )
    `)
    .ilike('name', `%${query}%`)
    .limit(20);

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  // Formatting products to make it easy for POS
  // We attach the active selling price from the batch that expires first (FEFO)
  return products.map((p) => {
    const activeBatches = p.batches
      .filter((b: Batch) => b.quantity > 0)
      .sort((a: Batch, b: Batch) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());

    const current_price = activeBatches.length > 0 ? activeBatches[0].selling_price : 0;
    const total_quantity = activeBatches.reduce((acc: number, b: Batch) => acc + b.quantity, 0);

    return {
      ...p,
      current_price,
      total_quantity,
      activeBatches,
    };
  });
}

export async function getProductByBarcode(barcode: string) {
  // First get the product via batch barcode
  const { data: batch, error: batchError } = await supabase
    .from('batches')
    .select('id, product_id')
    .eq('barcode', barcode)
    .gt('quantity', 0)
    .limit(1)
    .single();

  if (batchError || !batch) return null;

  // Then fetch the full product with all its active batches
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      *,
      batches (
        *
      )
    `)
    .eq('id', batch.product_id);

  if (error || !products || products.length === 0) return null;

  const p = products[0];
  const activeBatches = p.batches
    .filter((b: Batch) => b.quantity > 0)
    .sort((a: Batch, b: Batch) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());

  const current_price = activeBatches.length > 0 ? activeBatches[0].selling_price : 0;
  const total_quantity = activeBatches.reduce((acc: number, b: Batch) => acc + b.quantity, 0);

  return {
    ...p,
    current_price,
    total_quantity,
    activeBatches,
    scanned_batch_id: batch.id,
  };
}

// Update an existing batch
export async function updateBatch(batchId: string, updates: Partial<Batch>) {
  const { data, error } = await supabase
    .from('batches')
    .update(updates)
    .eq('id', batchId)
    .select()
    .single();

  if (error) {
    console.error('Error updating batch:', error);
    throw error;
  }
  return data;
}

export async function createBatch(batch: Partial<Batch>) {
  const pharmacyId = typeof window !== 'undefined' ? localStorage.getItem('selected_pharmacy_id') : null;
  const payload = pharmacyId ? { ...batch, pharmacy_id: pharmacyId } : batch;

  const { data, error } = await supabase
    .from('batches')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error creating batch:', error);
    throw error;
  }
  return data;
}
