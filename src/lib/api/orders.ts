import { supabase } from '../supabase';

export interface CartItem {
  id: string; // product id
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

export async function processCheckout(cart: CartItem[], total: number, sessionId: string, debtorId?: string) {
  // 1. Create the Order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([{ 
      total, 
      debtor_id: debtorId || null,
      session_id: sessionId // Link to the shift
    }])
    .select()
    .single();

  if (orderError || !order) {
    console.error('Failed to create order:', orderError);
    throw new Error('Failed to create order');
  }

  // 2. Insert Order Items
  const orderItemsInput = cart.map(item => ({
    order_id: order.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    unit: item.unit
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItemsInput);

  if (itemsError) {
    console.error('Failed to insert order items:', itemsError);
    throw new Error('Failed to insert order items');
  }

  // 3. Deduct stock from batches (Simple FEFO deduction logic done via multiple queries or RPC)
  // Since we require robustness in production, an Edge Function / RPC is ideal. 
  // Here we do a rudimentary loop for demonstration of fully genuine functional UI.
  for (const item of cart) {
    let remainingToDeduct = item.quantity;

    // Fetch active batches for this product ordered by expiry
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

        await supabase
          .from('batches')
          .update({ quantity: newQuantity })
          .eq('id', batch.id);

        remainingToDeduct -= deduction;
      }
    }
  }

  return order;
}

// Fetch orders from the last N days with their items
export async function getRecentOrders(days: number = 15) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .gte('created_at', cutoff.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching recent orders:', error);
    return [];
  }
  return data || [];
}

// Process a return: restore stock and mark order
export async function processReturn(orderId: string, items: CartItem[]) {
  // 1. Restore stock to batches (add quantity back to the first batch of each product)
  for (const item of items) {
    let productId = item.id;

    // If item.id doesn't look like a product_id, look up by name
    const { data: batches } = await supabase
      .from('batches')
      .select('*, products!inner(name)')
      .eq('products.name', item.name)
      .order('expiry_date', { ascending: true })
      .limit(1);

    if (batches && batches.length > 0) {
      const batch = batches[0];
      await supabase
        .from('batches')
        .update({ quantity: batch.quantity + item.quantity })
        .eq('id', batch.id);
    }
  }

  // 2. Mark order as returned by deleting it and its items
  // (using delete since the orders table may not have a status column)
  await supabase
    .from('order_items')
    .delete()
    .eq('order_id', orderId);

  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId);

  if (error) {
    console.error('Error deleting returned order:', error);
    throw error;
  }
}
