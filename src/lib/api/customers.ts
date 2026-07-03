import { supabase } from '../supabase';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  total_debt: number;
  loyalty_points: number;
  created_at?: string;
}

export interface CustomerPayment {
  id: string;
  customer_id: string;
  amount: number;
  payment_date: string;
  payment_type: 'partial' | 'full';
  note?: string;
}

export async function getCustomers() {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) return [];

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
  return data as Customer[];
}

export async function addCustomer(customer: Omit<Customer, 'id' | 'total_debt' | 'loyalty_points' | 'created_at'>) {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) throw new Error("Unauthorized Tenant");

  const trimmedName = customer.name?.trim() || '';
  if (!trimmedName) throw new Error("Validation Error: Customer name cannot be empty.");
  if (trimmedName.length > 100) throw new Error("Validation Error: Customer name is too long.");
  
  if (/<[^>]*>?/gm.test(trimmedName) || (customer.phone && /<[^>]*>?/gm.test(customer.phone))) {
    throw new Error('Validation Error: Malicious characters detected.');
  }

  // Remove loyalty_points: 0 since the column does not exist in database
  const { data, error } = await supabase
    .from('customers')
    .insert([{ ...customer, name: trimmedName, phone: customer.phone?.trim(), total_debt: 0, pharmacy_id: pharmacyId }])
    .select()
    .maybeSingle(); // ✅ safe

  if (error) {
    console.error('Error adding customer:', error);
    throw error;
  }
  if (!data) throw new Error('فشل إنشاء العميل.');
  return data as Customer;
}

export async function updateCustomer(id: string, updates: Partial<Customer>) {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) throw new Error("Unauthorized Tenant");

  // Protect against non-existent loyalty_points database column
  const { loyalty_points, ...cleanUpdates } = updates;

  const { data, error } = await supabase
    .from('customers')
    .update(cleanUpdates)
    .eq('id', id)
    .eq('pharmacy_id', pharmacyId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
  return data as Customer;
}

export async function getCustomerDetails(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) return null;

  const { data, error } = await supabase
    .from('customers')
    .select(`
      *,
      debt_payments (*),
      orders (
        *,
        order_items (*)
      )
    `)
    .eq('id', id)
    .eq('pharmacy_id', pharmacyId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching customer details:', error);
    return null;
  }
  return data;
}

export async function recordCustomerPayment(payment: Omit<CustomerPayment, 'id' | 'payment_date'>) {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) throw new Error("Unauthorized Tenant");

  // Map customer_id to debtor_id because database has debtor_id column
  const { data: paymentData, error: paymentError } = await supabase
    .from('debt_payments')
    .insert([{ 
      pharmacy_id: pharmacyId,
      debtor_id: payment.customer_id,
      amount: payment.amount,
      payment_type: payment.payment_type,
      note: payment.note
    }])
    .select()
    .maybeSingle(); // ✅ safe

  if (paymentError) {
    console.error('Error recording payment:', paymentError);
    throw paymentError;
  }
  if (!paymentData) throw new Error('فشل تسجيل الدفعة.');

  const { data: currentCustomer } = await supabase
    .from('customers')
    .select('total_debt')
    .eq('id', payment.customer_id)
    .eq('pharmacy_id', pharmacyId)
    .maybeSingle();

  if (currentCustomer) {
    await supabase
      .from('customers')
      .update({ total_debt: Math.max(0, Number(currentCustomer.total_debt || 0) - Number(payment.amount)) })
      .eq('id', payment.customer_id)
      .eq('pharmacy_id', pharmacyId);
  }

  return {
    id: paymentData.id,
    customer_id: paymentData.debtor_id,
    amount: paymentData.amount,
    payment_date: paymentData.payment_date || paymentData.created_at,
    payment_type: paymentData.payment_type,
    note: paymentData.note
  } as CustomerPayment;
}

