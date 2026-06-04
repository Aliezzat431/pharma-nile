import { supabase } from '../supabase';

export interface CartItem {
  id: string; // product id
  name: string;
  price: number;
  quantity: number;
  unit: string;
  batchId?: string;
  costPrice?: number;
  batchDistributions?: { batchId: string; quantity: number; price: number; purchasePrice: number; expiry?: string; }[];
}

export async function processCheckout(
  cart: CartItem[], 
  total: number, 
  paymentMethod: 'cash' | 'debt' | 'sadqah' = 'cash',
  customerId?: string
) {
  // Enforce security by extracting credentials via supabase.auth.getUser() instead of local form logic
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthenticated user. Cannot process checkout.');
  }

  const pharmacyId = user.user_metadata?.pharmacy_id;
  if (!pharmacyId) {
    throw new Error('Unauthorized: No pharmacy associated with this profile.');
  }

  // VALIDATION GUARDS (Zero/Negative numbers & Discount Caps)
  if (!cart || cart.length === 0) {
    throw new Error('Validation Error: Cart is empty.');
  }

  if (total < 0 || isNaN(total)) {
    throw new Error('Validation Error: Total order amount must be a valid positive number.');
  }

  // Pre-validate stock availability to prevent partial dirty inserts
  for (const item of cart) {
    if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      throw new Error(`Validation Error: Quantity for '${item.name}' must be a valid whole number greater than zero.`);
    }
    if (item.price < 0 || (item.costPrice !== undefined && item.costPrice < 0) || isNaN(item.price)) {
      throw new Error(`Validation Error: Price and Cost must be positive values for '${item.name}'.`);
    }

    // Prevent XSS / malicious input
    if (/<[^>]*>?/gm.test(item.name) || /<[^>]*>?/gm.test(item.unit)) {
      throw new Error(`Validation Error: Malicious characters detected in product details.`);
    }

    const { data: batches } = await supabase
      .from('batches')
      .select('quantity')
      .eq('product_id', item.id)
      .eq('pharmacy_id', pharmacyId);
      
    const totalAvailable = batches?.reduce((sum, b) => sum + Number(b.quantity), 0) || 0;
    if (item.quantity > totalAvailable) {
      throw new Error(`Validation Error: Requested quantity for '${item.name}' exceeds available stock (${totalAvailable}).`);
    }
  }

  // Calculate cost and profit using per-batch pricing when available
  let costTotal = 0;
  let revenueTotal = 0;
  for (const item of cart) {
    if (item.batchDistributions && item.batchDistributions.length > 0) {
      for (const dist of item.batchDistributions) {
        costTotal += (dist.purchasePrice || 0) * dist.quantity;
        revenueTotal += dist.price * dist.quantity;
      }
    } else {
      costTotal += (item.costPrice || 0) * item.quantity;
      revenueTotal += item.price * item.quantity;
    }
  }
  // Recalculate total from actual batch distributions for accuracy
  const finalTotal = revenueTotal > 0 ? revenueTotal : total;
  const profitTotal = finalTotal - costTotal;

  const orderBase = { 
    total: finalTotal, 
    cost_total: costTotal,
    profit_total: profitTotal,
    customer_id: customerId || null,
    payment_method: paymentMethod,
    status: 'completed'
  };
  
  // 1. Create the Order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([{ ...orderBase, ...(pharmacyId ? { pharmacy_id: pharmacyId } : {}) }])
    .select()
    .single();

  if (orderError || !order) {
    console.error('Failed to create order:', orderError);
    throw new Error('Failed to create order');
  }

  // 1b. Update customer balance if it's a debt
  if (paymentMethod === 'debt' && customerId) {
    const { data: customer } = await supabase.from('customers').select('total_debt').eq('id', customerId).eq('pharmacy_id', pharmacyId).single();
    if (customer) {
      await supabase
        .from('customers')
        .update({ total_debt: customer.total_debt + finalTotal })
        .eq('id', customerId)
        .eq('pharmacy_id', pharmacyId);
    }
  }

  // 2. Insert Order Items & Deduct Stock
  for (const item of cart) {
    let remainingToDeduct = item.quantity;
    
    // First, process any explicit batch distributions the user/system assigned
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
          .eq('pharmacy_id', pharmacyId)
          .single();

        if (explicitBatch) {
          const newQuantity = explicitBatch.quantity - deduction;

          // Record the item linked to this exact batch — use THIS batch's price
          await supabase
            .from('order_items')
            .insert([{
              order_id: order.id,
              product_id: item.id,
              batch_id: explicitBatch.id,
              name: item.name,
              price: dist.price,  // ← per-batch selling price
              quantity: deduction,
              unit: item.unit,
              pharmacy_id: pharmacyId
            }]);

          // Update batch stock
          await supabase
            .from('batches')
            .update({ quantity: newQuantity })
            .eq('id', explicitBatch.id)
            .eq('pharmacy_id', pharmacyId);

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
        .eq('pharmacy_id', pharmacyId)
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
              unit: item.unit,
              pharmacy_id: pharmacyId
            }]);

          // Update batch
          await supabase
            .from('batches')
            .update({ quantity: newQuantity })
            .eq('id', batch.id)
            .eq('pharmacy_id', pharmacyId);

          remainingToDeduct -= deduction;
        }
      }
    }
  }

  return order;
}

export async function getRecentOrders(days: number = 15, pharmacyId: string) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers (name),
      order_items (*)
    `)
    .eq('pharmacy_id', pharmacyId)
    .gte('created_at', cutoff.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching recent orders:', error);
    return [];
  }
  return data || [];
}

export async function processReturn(orderId: string, items: any[]) {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) throw new Error('Unauthorized');

  // 1. Restore stock to specific batches
  for (const item of items) {
    if (item.batch_id) {
      const { data: batch } = await supabase
        .from('batches')
        .select('quantity')
        .eq('id', item.batch_id)
        .eq('pharmacy_id', pharmacyId)
        .single();
      
      if (batch) {
        await supabase
          .from('batches')
          .update({ quantity: batch.quantity + item.quantity })
          .eq('id', item.batch_id)
          .eq('pharmacy_id', pharmacyId);
      }
    }
  }

  // 2. Mark order as returned
  const { error } = await supabase
    .from('orders')
    .update({ status: 'returned' })
    .eq('id', orderId)
    .eq('pharmacy_id', pharmacyId);

  if (error) {
    console.error('Error processing return:', error);
    throw error;
  }
}
