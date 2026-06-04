import { supabase } from '../supabase';

export interface SadqahEntry {
  id: string;
  amount: number;
  date: string;
  items: string[]; // Names of products
}

export async function getSadqahStats() {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) return { entries: [], totalAmount: 0 };

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      total,
      created_at,
      order_items (
        name
      )
    `)
    .eq('pharmacy_id', pharmacyId)
    .eq('payment_method', 'sadqah')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sadqah stats:', error);
    return { entries: [], totalAmount: 0 };
  }

  const entries = data.map((o: any) => ({
    id: o.id,
    amount: o.total,
    date: o.created_at,
    items: o.order_items.map((i: any) => i.name)
  }));

  const totalAmount = entries.reduce((acc, curr) => acc + curr.amount, 0);

  return { entries, totalAmount };
}
