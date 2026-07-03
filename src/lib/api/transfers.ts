import { supabase } from '../supabase';

export interface StockTransfer {
  id: string;
  from_pharmacy_id: string;
  to_pharmacy_id: string;
  product_name: string;
  quantity: number;
  status: 'pending' | 'shipped' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
}

export async function searchOtherPharmacies(term: string, currentPharmacyId: string) {
  const { data, error } = await supabase
    .rpc('find_product_in_other_pharmacies', {
      search_term: term,
      current_pharmacy_id: currentPharmacyId
    });

  if (error) {
    console.error('Error searching other pharmacies:', error);
    throw error;
  }
  return data || [];
}

export async function requestTransfer(
  fromPharmacyId: string, 
  toPharmacyId: string, 
  productName: string, 
  quantity: number,
  notes: string = ''
) {

  const { data: { user } } = await supabase.auth.getUser();
  if (user && user.user_metadata?.pharmacy_id !== toPharmacyId) {
    await supabase.auth.updateUser({ data: { pharmacy_id: toPharmacyId } });
    await supabase.auth.refreshSession();
  }

  const { data, error } = await supabase
    .from('stock_transfers')
    .insert([{
      from_pharmacy_id: fromPharmacyId,
      to_pharmacy_id: toPharmacyId,
      product_name: productName,
      quantity,
      notes,
      status: 'pending'
    }])
    .select()
    .maybeSingle(); // ✅ safe

  if (error) {
    console.error('Error requesting transfer:', error);
    throw error;
  }
  if (!data) throw new Error('فشل إنشاء طلب النقل.');
  return data;
}

export async function getTransfers(pharmacyId: string) {
  const { data, error } = await supabase
    .from('stock_transfers')
    .select(`
      *,
      from_pharmacy:pharmacies!stock_transfers_from_pharmacy_id_fkey(name),
      to_pharmacy:pharmacies!stock_transfers_to_pharmacy_id_fkey(name)
    `)
    .or(`from_pharmacy_id.eq.${pharmacyId},to_pharmacy_id.eq.${pharmacyId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching transfers:', error);
    throw error;
  }
  return data || [];
}

export async function shipTransfer(transferId: string, fromPharmacyId: string, productId: string) {

  const { data: { user } } = await supabase.auth.getUser();
  if (user && user.user_metadata?.pharmacy_id !== fromPharmacyId) {
    await supabase.auth.updateUser({ data: { pharmacy_id: fromPharmacyId } });
    await supabase.auth.refreshSession();
  }

  const { data: transfer, error: fetchError } = await supabase
    .from('stock_transfers')
    .select('*')
    .eq('id', transferId)
    .eq('from_pharmacy_id', fromPharmacyId)
    .maybeSingle();

  if (fetchError || !transfer) throw new Error('Transfer not found or unauthorized');
  if (transfer.status !== 'pending') throw new Error('Transfer is not pending');

  let remainingToDeduct = transfer.quantity;
  const { data: batches } = await supabase
    .from('batches')
    .select('*')
    .eq('product_id', productId)
    .eq('pharmacy_id', fromPharmacyId)
    .gt('quantity', 0)
    .order('expiry_date', { ascending: true });

  if (!batches || batches.length === 0) {
    throw new Error('No stock available to ship this transfer.');
  }

  const totalAvailable = batches.reduce((sum, b) => sum + Number(b.quantity), 0);
  if (totalAvailable < remainingToDeduct) {
    throw new Error('Insufficient stock to fulfill this transfer.');
  }

  for (const batch of batches) {
    if (remainingToDeduct <= 0) break;
    const deduction = Math.min(batch.quantity, remainingToDeduct);
    const newQuantity = batch.quantity - deduction;

    await supabase
      .from('batches')
      .update({ quantity: newQuantity })
      .eq('id', batch.id)
      .eq('pharmacy_id', fromPharmacyId);

    remainingToDeduct -= deduction;
  }

  const { error: updateError } = await supabase
    .from('stock_transfers')
    .update({ status: 'shipped' })
    .eq('id', transferId);

  if (updateError) throw updateError;
}

export async function receiveTransfer(
  transferId: string, 
  toPharmacyId: string, 
  receiveDetails: { productId: string, batchId?: string, price?: number, cost?: number, expiryDate?: string }
) {

  const { data: { user } } = await supabase.auth.getUser();
  if (user && user.user_metadata?.pharmacy_id !== toPharmacyId) {
    await supabase.auth.updateUser({ data: { pharmacy_id: toPharmacyId } });
    await supabase.auth.refreshSession();
  }

  const { data: transfer, error: fetchError } = await supabase
    .from('stock_transfers')
    .select('*')
    .eq('id', transferId)
    .eq('to_pharmacy_id', toPharmacyId)
    .maybeSingle();

  if (fetchError || !transfer) throw new Error('Transfer not found or unauthorized');
  if (transfer.status !== 'shipped') throw new Error('Transfer is not shipped');

  if (receiveDetails.batchId) {

    const { data: batch } = await supabase.from('batches').select('quantity').eq('id', receiveDetails.batchId).maybeSingle();
    if (batch) {
      await supabase.from('batches').update({ quantity: Number(batch.quantity) + Number(transfer.quantity) }).eq('id', receiveDetails.batchId);
    }
  } else {

    await supabase.from('batches').insert([{
      pharmacy_id: toPharmacyId,
      product_id: receiveDetails.productId,
      barcode: 'TRANS-' + Date.now(),
      quantity: transfer.quantity,
      purchase_price: receiveDetails.cost || 0,
      sale_price: receiveDetails.price || 0,
      expiry_date: receiveDetails.expiryDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    }]);
  }

  const { error: updateError } = await supabase
    .from('stock_transfers')
    .update({ status: 'completed' })
    .eq('id', transferId);

  if (updateError) throw updateError;
}

export async function cancelTransfer(transferId: string, pharmacyId: string) {

  const { data: { user } } = await supabase.auth.getUser();
  if (user && user.user_metadata?.pharmacy_id !== pharmacyId) {
    await supabase.auth.updateUser({ data: { pharmacy_id: pharmacyId } });
    await supabase.auth.refreshSession();
  }

  const { error } = await supabase
    .from('stock_transfers')
    .update({ status: 'cancelled' })
    .eq('id', transferId)
    .eq('status', 'pending')
    .or(`from_pharmacy_id.eq.${pharmacyId},to_pharmacy_id.eq.${pharmacyId}`);
    
  if (error) throw error;
}

