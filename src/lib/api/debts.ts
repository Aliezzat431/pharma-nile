import { supabase } from '../supabase';

export interface Debtor {
  id: string;
  pharmacy_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  total_debt: number;
  created_at: string;
}

export interface DebtPayment {
  id: string;
  debtor_id: string;
  pharmacy_id: string;
  amount: number;
  payment_date: string;
  payment_type: 'partial' | 'full';
  note?: string;
}

export async function getDebtors(): Promise<Debtor[]> {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) return [];

  // Query customers table instead of hypothetical debtors table
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching debtors:', error);
    throw error;
  }

  return (data || []) as Debtor[];
}

export async function addDebtor(debtorData: Omit<Debtor, 'id' | 'total_debt' | 'created_at' | 'pharmacy_id'>): Promise<Debtor> {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) throw new Error("Unauthorized Tenant");

  const trimmedName = debtorData.name?.trim() || '';
  if (!trimmedName) throw new Error("Validation Error: Debtor name cannot be empty.");
  if (trimmedName.length > 100) throw new Error("Validation Error: Debtor name is too long.");
  if (/<[^>]*>?/gm.test(trimmedName) || (debtorData.phone && /<[^>]*>?/gm.test(debtorData.phone))) {
    throw new Error('Validation Error: Malicious characters detected.');
  }

  // Insert into customers table instead of hypothetical debtors table
  // Do not include loyalty_points (non-existent db column)
  const { data, error } = await supabase
    .from('customers')
    .insert([
      {
        name: trimmedName,
        phone: debtorData.phone?.trim(),
        pharmacy_id: pharmacyId,
        total_debt: 0, // Starts at 0
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error adding debtor:', error);
    throw error;
  }

  return data as Debtor;
}

export async function recordPayment(payment: Omit<DebtPayment, 'id' | 'payment_date' | 'pharmacy_id'>): Promise<DebtPayment> {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) throw new Error("Unauthorized Tenant");

  if (!payment.amount || isNaN(payment.amount) || payment.amount <= 0) {
    throw new Error("Validation Error: Payment amount must be a positive number.");
  }
  if (payment.note && /<[^>]*>?/gm.test(payment.note)) {
    throw new Error("Validation Error: Malicious characters detected in payment note.");
  }

  const { data: paymentData, error: paymentError } = await supabase
    .from('debt_payments')
    .insert([
      {
        debtor_id: payment.debtor_id,
        pharmacy_id: pharmacyId,
        amount: payment.amount,
        payment_type: payment.payment_type,
        note: payment.note?.trim(),
      },
    ])
    .select()
    .single();

  if (paymentError) {
    console.error('Error recording debt payment:', paymentError);
    throw paymentError;
  }

  // Directly update the customer's outstanding balance in customers table (avoiding non-existent update_debtor_balance RPC)
  const { data: debtor } = await supabase
    .from('customers')
    .select('total_debt')
    .eq('id', payment.debtor_id)
    .eq('pharmacy_id', pharmacyId)
    .single();

  if (debtor) {
    const newDebt = Math.max(0, debtor.total_debt - payment.amount);
    
    await supabase
      .from('customers')
      .update({ total_debt: newDebt })
      .eq('id', payment.debtor_id)
      .eq('pharmacy_id', pharmacyId);
  }

  // Record a pharmacy financial transaction for bookkeeping
  await supabase
    .from('financial_transactions')
    .insert([
      {
        pharmacy_id: pharmacyId,
        type: 'revenue',
        amount: payment.amount,
        source: 'debt_collection',
        description: `تحصيل مديونية - عميل رقم #${payment.debtor_id.substring(0, 5)}`,
      }
    ]);

  return paymentData as DebtPayment;
}

export async function getPaymentHistory(debtorId: string): Promise<DebtPayment[]> {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) return [];

  const { data, error } = await supabase
    .from('debt_payments')
    .select('*')
    .eq('debtor_id', debtorId)
    .eq('pharmacy_id', pharmacyId)
    .order('payment_date', { ascending: false });

  if (error) {
    console.error('Error fetching payment history:', error);
    throw error;
  }

  return data || [];
}

export async function getDebtorDetails(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) return null;

  // Fetch from customers table instead of hypothetical debtors table
  const { data, error } = await supabase
    .from('customers')
    .select('*, debt_payments(*)')
    .eq('id', id)
    .eq('pharmacy_id', pharmacyId)
    .single();

  if (error) {
    console.error('Error fetching debtor details:', error);
    return null;
  }
  return data;
}
