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

  const { data, error } = await supabase
    .from('customers')
    .insert([{ ...customer, name: trimmedName, phone: customer.phone?.trim(), total_debt: 0, loyalty_points: 0, pharmacy_id: pharmacyId }])
    .select()
    .single();

  if (error) {
    console.error('Error adding customer:', error);
    throw error;
  }
  return data as Customer;
}

export async function updateCustomer(id: string, updates: Partial<Customer>) {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) throw new Error("Unauthorized Tenant");

  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .eq('pharmacy_id', pharmacyId)
    .select()
    .single();

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
    .single();

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

  const { data: paymentData, error: paymentError } = await supabase
    .from('debt_payments')
    .insert([{ ...payment, pharmacy_id: pharmacyId }])
    .select()
    .single();

  if (paymentError) {
    console.error('Error recording payment:', paymentError);
    throw paymentError;
  }

  // Update total_debt balance
  const { data: currentCustomer } = await supabase
    .from('customers')
    .select('total_debt')
    .eq('id', payment.customer_id)
    .eq('pharmacy_id', pharmacyId)
    .single();

  if (currentCustomer) {
    await supabase
      .from('customers')
      .update({ total_debt: Math.max(0, currentCustomer.total_debt - payment.amount) })
      .eq('id', payment.customer_id)
      .eq('pharmacy_id', pharmacyId);
  }

  return paymentData as CustomerPayment;
}
