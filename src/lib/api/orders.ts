import { supabase } from '../supabase';

export interface CartItem {
  id: string; // product id
  name: string;
  price: number;
  quantity: number;
  unit: string;
  batchId?: string;
  costPrice?: number;
  batchDistributions?: { batchId: string; quantity: number; price: number; }[];
}

export async function processCheckout(
  cart: CartItem[], 
  total: number, 
  paymentMethod: 'cash' | 'debt' | 'sadqah' = 'cash',
  customerId?: string
) {
  // Calculate cost and profit
  const costTotal = cart.reduce((acc, item) => acc + (item.costPrice || 0) * item.quantity, 0);
  const profitTotal = total - costTotal;

  // 1. Create the Order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([{ 
      total, 
      cost_total: costTotal,
      profit_total: profitTotal,
      customer_id: customerId || null,
      payment_method: paymentMethod,
      status: 'completed'
    }])
    .select()
    .single();

  if (orderError || !order) {
    console.error('Failed to create order:', orderError);
    throw new Error('Failed to create order');
  }

  // 1b. Update customer balance if it's a debt
  if (paymentMethod === 'debt' && customerId) {
    const { data: customer } = await supabase.from('customers').select('total_debt').eq('id', customerId).single();
    if (customer) {
      await supabase
        .from('customers')
        .update({ total_debt: customer.total_debt + total })
        .eq('id', customerId);
    }
  }

  // 2. Insert Order Items & Deduct Stock
  for (const item of cart) {
    let remainingToDeduct = item.quantity;
    
    // First, process any explicit batch distributions the user assigned
    if (item.batchDistributions && item.batchDistributions.length > 0) {
      for (const dist of item.batchDistributions) {
        if (dist.quantity <= 0) continue;
        if (remainingToDeduct <= 0) break;

        const deduction = Math.min(dist.quantity, remainingToDeduct);
        
        // Fetch current batch explicitly
        const { data: explicitBatch } = await supabase
          .from('batches')
          .select('id, quantity')
          .eq('id', dist.batchId)
          .single();

        if (explicitBatch) {
          const newQuantity = explicitBatch.quantity - deduction;

          // Record the item linked to this exact batch
          await supabase
            .from('order_items')
            .insert([{
              order_id: order.id,
              product_id: item.id,
              batch_id: explicitBatch.id,
              name: item.name,
              price: item.price,
              quantity: deduction,
              unit: item.unit
            }]);

          // Update batch stock
          await supabase
            .from('batches')
            .update({ quantity: newQuantity })
            .eq('id', explicitBatch.id);

          remainingToDeduct -= deduction;
        }
      }
    }

    // If there is still quantity to deduct (either no explicit distributions or they didn't cover the full quantity),
    // fallback to automatic FEFO deduction.
    if (remainingToDeduct > 0) {
      const { data: batches } = await supabase
        .from('batches')
        .select('*')
        .eq('product_id', item.id)
        .gt('quantity', 0)
        .order('expiry_date', { ascending: true });

      if (batches) {
        for (const batch of batches) {
          if (remainingToDeduct <= 0) break;

          const deduction = Math.min(batch.quantity, remainingToDeduct);
          const newQuantity = batch.quantity - deduction;

          // Record the item linked to this batch
          await supabase
            .from('order_items')
            .insert([{
              order_id: order.id,
              product_id: item.id,
              batch_id: batch.id,
              name: item.name,
              price: item.price,
              quantity: deduction,
              unit: item.unit
            }]);

          // Update batch
          await supabase
            .from('batches')
            .update({ quantity: newQuantity })
            .eq('id', batch.id);

          remainingToDeduct -= deduction;
        }
      }
    }
  }

  return order;
}

export async function getRecentOrders(days: number = 15) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers (name),
      order_items (*)
    `)
    .gte('created_at', cutoff.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching recent orders:', error);
    return [];
  }
  return data || [];
}

export async function processReturn(orderId: string, items: any[]) {
  // 1. Restore stock to specific batches
  for (const item of items) {
    if (item.batch_id) {
      const { data: batch } = await supabase
        .from('batches')
        .select('quantity')
        .eq('id', item.batch_id)
        .single();
      
      if (batch) {
        await supabase
          .from('batches')
          .update({ quantity: batch.quantity + item.quantity })
          .eq('id', item.batch_id);
      }
    }
  }

  // 2. Mark order as returned
  const { error } = await supabase
    .from('orders')
    .update({ status: 'returned' })
    .eq('id', orderId);

  if (error) {
    console.error('Error processing return:', error);
    throw error;
  }
}
