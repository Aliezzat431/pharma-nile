import { supabase } from '../supabase';

export interface Debtor {
  id: string;
  name: string;
  phone?: string;
  total_debt: number;
  created_at?: string;
}

export interface DebtPayment {
  id: string;
  debtor_id: string;
  amount: number;
  payment_date: string;
  payment_type: 'partial' | 'full';
  note?: string;
}

export async function getDebtors() {
  const { data, error } = await supabase
    .from('debtors')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching debtors:', error);
    return [];
  }
  return data as Debtor[];
}

export async function addDebtor(debtor: Omit<Debtor, 'id' | 'total_debt' | 'created_at'>) {
  const { data, error } = await supabase
    .from('debtors')
    .insert([{ ...debtor, total_debt: 0 }])
    .select()
    .single();

  if (error) {
    console.error('Error adding debtor:', error);
    throw error;
  }
  return data as Debtor;
}

export async function recordPayment(payment: Omit<DebtPayment, 'id' | 'payment_date'>) {
  // 1. Insert the payment record
  const { data: paymentData, error: paymentError } = await supabase
    .from('debt_payments')
    .insert([payment])
    .select()
    .single();

  if (paymentError) {
    console.error('Error recording payment:', paymentError);
    throw paymentError;
  }

  // 2. Update the debtor's total_debt balance
  const { data: debtorData, error: debtorError } = await supabase.rpc('update_debtor_balance', {
    target_debtor_id: payment.debtor_id,
    payment_amount: payment.amount
  });

  // If RPC is not defined yet, we do it manually (atomicity warning)
  if (debtorError) {
    const { data: currentDebtor } = await supabase.from('debtors').select('total_debt').eq('id', payment.debtor_id).single();
    if (currentDebtor) {
      await supabase
        .from('debtors')
        .update({ total_debt: Math.max(0, currentDebtor.total_debt - payment.amount) })
        .eq('id', payment.debtor_id);
    }
  }

  return paymentData as DebtPayment;
}

export async function getPaymentHistory(debtorId: string) {
  const { data, error } = await supabase
    .from('debt_payments')
    .select('*')
    .eq('debtor_id', debtorId)
    .order('payment_date', { ascending: false });

  if (error) {
    console.error('Error fetching payment history:', error);
    return [];
  }
  return data as DebtPayment[];
}

export async function getDebtorDetails(id: string) {
  const { data, error } = await supabase
    .from('debtors')
    .select('*, debt_payments(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching debtor details:', error);
    return null;
  }
  return data;
}
