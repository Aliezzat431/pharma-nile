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
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
  return data as Customer[];
}

export async function addCustomer(customer: Omit<Customer, 'id' | 'total_debt' | 'loyalty_points' | 'created_at'>) {
  const { data, error } = await supabase
    .from('customers')
    .insert([{ ...customer, total_debt: 0, loyalty_points: 0 }])
    .select()
    .single();

  if (error) {
    console.error('Error adding customer:', error);
    throw error;
  }
  return data as Customer;
}

export async function updateCustomer(id: string, updates: Partial<Customer>) {
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
  return data as Customer;
}

export async function getCustomerDetails(id: string) {
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
    .single();

  if (error) {
    console.error('Error fetching customer details:', error);
    return null;
  }
  return data;
}

export async function recordCustomerPayment(payment: Omit<CustomerPayment, 'id' | 'payment_date'>) {
  const { data: paymentData, error: paymentError } = await supabase
    .from('debt_payments')
    .insert([payment])
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
    .single();

  if (currentCustomer) {
    await supabase
      .from('customers')
      .update({ total_debt: Math.max(0, currentCustomer.total_debt - payment.amount) })
      .eq('id', payment.customer_id);
  }

  return paymentData as CustomerPayment;
}
