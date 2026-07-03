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

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthenticated user. Cannot process checkout.');
  }

  const pharmacyId = user.user_metadata?.pharmacy_id;
  if (!pharmacyId) {
    throw new Error('Unauthorized: No pharmacy associated with this profile.');
  }

  if (!cart || cart.length === 0) {
    throw new Error('Validation Error: Cart is empty.');
  }
  if (total < 0 || isNaN(total)) {
    throw new Error('Validation Error: Total order amount must be a valid positive number.');
  }

  for (const item of cart) {
    if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      throw new Error(`Validation Error: Quantity for '${item.name}' must be a valid whole number greater than zero.`);
    }
    if (item.price < 0 || (item.costPrice !== undefined && item.costPrice < 0) || isNaN(item.price)) {
      throw new Error(`Validation Error: Price and Cost must be positive values for '${item.name}'.`);
    }
    if (/<[^>]*>?/gm.test(item.name) || /<[^>]*>?/gm.test(item.unit)) {
      throw new Error(`Validation Error: Malicious characters detected in product details.`);
    }
  }

  const productIds = [...new Set(cart.map(i => i.id))];
  const { data: allBatches } = await supabase
    .from('batches')
    .select('product_id, quantity')
    .eq('pharmacy_id', pharmacyId)
    .in('product_id', productIds);

  let hasShortage = false;
  for (const item of cart) {
    const available = (allBatches || [])
      .filter(b => b.product_id === item.id)
      .reduce((sum, b) => sum + Number(b.quantity), 0);
    
    if (item.quantity > available) {
      hasShortage = true;
      // We allow the checkout but it will be flagged as negative stock / out of stock sale (backdoor)
    }
  }


  const rpcCart = cart.map(item => ({
    product_id: item.id,
    name:       item.name,
    quantity:   item.quantity,
    price:      item.price,
    unit:       item.unit,
    cost_price: item.costPrice || 0,
    batch_distributions: (item.batchDistributions || []).map(d => ({
      batch_id:       d.batchId,
      quantity:       d.quantity,
      price:          d.price,
      purchase_price: d.purchasePrice,
    }))
  }));

  const { data: rpcResult, error: rpcError } = await supabase.rpc('fast_checkout', {
    p_pharmacy_id:    pharmacyId,
    p_user_id:        user.id,
    p_cart:           rpcCart,
    p_total:          total,
    p_payment_method: paymentMethod,
    p_customer_id:    customerId || null,
  });

  if (rpcError) {
    console.error('fast_checkout RPC failed, falling back to JS checkout:', rpcError);
    return await _jsCheckoutFallback(cart, total, paymentMethod, customerId, pharmacyId);
  }

  return { id: rpcResult.order_id, total: rpcResult.total };
}


async function _jsCheckoutFallback(
  cart: CartItem[],
  total: number,
  paymentMethod: 'cash' | 'debt' | 'sadqah',
  customerId: string | undefined,
  pharmacyId: string
) {
  let costTotal = 0;
  let revenueTotal = 0;
  for (const item of cart) {
    if (item.batchDistributions && item.batchDistributions.length > 0) {
      for (const dist of item.batchDistributions) {
        costTotal    += (dist.purchasePrice || 0) * dist.quantity;
        revenueTotal += dist.price * dist.quantity;
      }
    } else {
      costTotal    += (item.costPrice || 0) * item.quantity;
      revenueTotal += item.price * item.quantity;
    }
  }
  const finalTotal  = revenueTotal > 0 ? revenueTotal : total;
  const profitTotal = finalTotal - costTotal;

  const orderBase = {
    total: finalTotal,
    cost_total: costTotal,
    profit_total: profitTotal,
    customer_id: customerId || null,
    payment_method: paymentMethod,
    status: 'completed'
  };

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([{ ...orderBase, pharmacy_id: pharmacyId }])
    .select()
    .maybeSingle(); // ✅ safe — avoids PGRST116 if RLS blocks the insert

  if (orderError || !order) throw new Error('Failed to create order');

  if (paymentMethod === 'debt' && customerId) {
    const { data: customer } = await supabase.from('customers').select('total_debt').eq('id', customerId).eq('pharmacy_id', pharmacyId).maybeSingle();
    if (customer) {
      const safeDebt = Math.max(0, Number(customer.total_debt || 0) + finalTotal);
      await supabase.from('customers').update({ total_debt: safeDebt }).eq('id', customerId).eq('pharmacy_id', pharmacyId);
    }
  }

  // Get inventory method from settings
  const { data: settings } = await supabase
    .from('pharmacy_settings')
    .select('inventory_method')
    .eq('pharmacy_id', pharmacyId)
    .maybeSingle();
  
  const method = settings?.inventory_method || 'FEFO';

  for (const item of cart) {
    let remainingToDeduct = item.quantity;

    if (item.batchDistributions && item.batchDistributions.length > 0) {
      for (const dist of item.batchDistributions) {
        if (dist.quantity <= 0 || remainingToDeduct <= 0) continue;
        const deduction = Math.min(dist.quantity, remainingToDeduct);
        const { data: explicitBatch } = await supabase.from('batches').select('id, quantity').eq('id', dist.batchId).eq('pharmacy_id', pharmacyId).maybeSingle();
        if (explicitBatch) {
          await supabase.from('order_items').insert([{ order_id: order.id, product_id: item.id, batch_id: explicitBatch.id, name: item.name, price: dist.price, quantity: deduction, unit: item.unit, pharmacy_id: pharmacyId }]);
          await supabase.from('batches').update({ quantity: explicitBatch.quantity - deduction }).eq('id', explicitBatch.id).eq('pharmacy_id', pharmacyId);
          remainingToDeduct -= deduction;
        }
      }
    }

    if (remainingToDeduct > 0) {
      let query = supabase.from('batches').select('*').eq('product_id', item.id).eq('pharmacy_id', pharmacyId).gt('quantity', 0);
      
      if (method === 'FEFO') {
        query = query.order('expiry_date', { ascending: true });
      } else if (method === 'FIFO') {
        query = query.order('created_at', { ascending: true });
      } else if (method === 'LIFO') {
        query = query.order('created_at', { ascending: false });
      }

      const { data: batches } = await query;
      if (batches) {
        for (const batch of batches) {
          if (remainingToDeduct <= 0) break;
          const deduction = Math.min(batch.quantity, remainingToDeduct);
          await supabase.from('order_items').insert([{ order_id: order.id, product_id: item.id, batch_id: batch.id, name: item.name, price: item.price, quantity: deduction, unit: item.unit, pharmacy_id: pharmacyId }]);
          await supabase.from('batches').update({ quantity: batch.quantity - deduction }).eq('id', batch.id).eq('pharmacy_id', pharmacyId);
          remainingToDeduct -= deduction;
        }
      }
      
      if (remainingToDeduct > 0) {
        // Backdoor sale (out of stock tracking)
        await supabase.from('order_items').insert([{ 
          order_id: order.id, 
          product_id: item.id, 
          batch_id: null, 
          name: item.name + ' (بيع عجز صفري)', 
          price: item.price, 
          quantity: remainingToDeduct, 
          unit: item.unit, 
          pharmacy_id: pharmacyId 
        }]);
        
        // Mark the order as having a shortage issue for admin tracking
        await supabase.from('orders').update({ notes: 'يحتوي على بيع من العجز' }).eq('id', order.id).eq('pharmacy_id', pharmacyId);
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

export async function processReturn(orderId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) throw new Error('Unauthorized');

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .eq('pharmacy_id', pharmacyId)
    .maybeSingle();

  if (fetchError || !order) {
    throw new Error('Order not found or access denied');
  }

  if (order.status === 'returned') {
    throw new Error('This order has already been returned');
  }

  for (const item of order.order_items) {
    if (item.batch_id) {
      const { data: batch } = await supabase
        .from('batches')
        .select('quantity')
        .eq('id', item.batch_id)
        .eq('pharmacy_id', pharmacyId)
        .maybeSingle();
      
      if (batch) {
        await supabase
          .from('batches')
          .update({ quantity: (batch.quantity || 0) + (item.quantity || 0) })
          .eq('id', item.batch_id)
          .eq('pharmacy_id', pharmacyId);
      }
    }
  }

  if (order.payment_method === 'debt' && order.customer_id) {
    const { data: customer } = await supabase
      .from('customers')
      .select('total_debt')
      .eq('id', order.customer_id)
      .eq('pharmacy_id', pharmacyId)
      .maybeSingle();

    if (customer) {
      const newDebt = Math.max(0, (customer.total_debt || 0) - (order.total || 0));
      await supabase
        .from('customers')
        .update({ total_debt: newDebt })
        .eq('id', order.customer_id)
        .eq('pharmacy_id', pharmacyId);
    }
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: 'returned' })
    .eq('id', orderId)
    .eq('pharmacy_id', pharmacyId);

  if (updateError) {
    console.error('Error updating order status:', updateError);
    throw updateError;
  }
}

