import { supabase } from '../supabase';

export interface CartItem {
  id: string; 
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

  let calculatedSafeTotal = 0;

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
    .select('id, product_id, quantity, sale_price')
    .eq('pharmacy_id', pharmacyId)
    .in('product_id', productIds);

  for (const item of cart) {
    const productBatches = (allBatches || []).filter(b => b.product_id === item.id);
    const available = productBatches.reduce((sum, b) => sum + Number(b.quantity), 0);
    
    if (item.quantity > available) {
      throw new Error(`خطأ أمني: الرصيد المسجل للمنتج ${item.name} غير كافي. تم إيقاف المعاملة لتجنب إفساد المخزون.`);
    }

    
    const validPrices = productBatches.map(b => b.sale_price);
    if (validPrices.length > 0 && !validPrices.includes(item.price)) {
      if (item.price === 0 && paymentMethod === 'sadqah') {
        
      } else {
        throw new Error(`تلاعب في الأسعار (Tamper Alert): السعر المرسل للمنتج ${item.name} لا يطابق أي تسعيرة موثقة بالخوادم.`);
      }
    }

    calculatedSafeTotal += (item.price * item.quantity);
  }

  if (Math.abs(calculatedSafeTotal - total) > 0.1 && paymentMethod !== 'sadqah') {
    throw new Error('تلاعب في الإجمالي: تم حظر تمرير الفاتورة بسبب تفاوت إجمالي السلة عن البيانات المعتمدة.');
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
    p_total:          calculatedSafeTotal,
    p_payment_method: paymentMethod,
    p_customer_id:    customerId || null,
  });

  if (rpcError) {
    console.error('[ACID CHECKOUT FAILED]', rpcError);
    throw new Error(`فشل تام في المعاملة: حدث خطأ في الخوادم ولم يتم تسجيل الفاتورة لتجنب تلف المخزون.`);
  }

  return { id: rpcResult.order_id, total: rpcResult.total };
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

  
  const { data: result, error: rpcError } = await supabase.rpc('process_return_atomic', {
    p_order_id: orderId,
    p_pharmacy_id: pharmacyId
  });

  if (rpcError) {
    console.error('Atomic Return Failed:', rpcError);
    throw new Error(`فشل تنفيذ المرتجع بأمان: ${rpcError.message}`);
  }

  return true;
}
