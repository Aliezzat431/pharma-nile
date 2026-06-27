import { supabase } from '../supabase';

export interface Debtor {
  id: string;
  pharmacy_id: string;
  name: string;
  phone?: string;
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

  const { data, error } = await supabase
    .from('debtors')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching debtors:', error);
    throw error;
  }

  return data || [];
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

  const { data, error } = await supabase
    .from('debtors')
    .insert([
      {
        name: trimmedName,
        phone: debtorData.phone?.trim(),
        pharmacy_id: pharmacyId,
        total_debt: 0, // يبدأ الحساب بصفر حتى تتم عملية بيع آجل
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error adding debtor:', error);
    throw error;
  }

  return data;
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

  const { error: debtorError } = await supabase.rpc('update_debtor_balance', {
    target_debtor_id: payment.debtor_id,
    payment_amount: payment.amount,
  });

  if (debtorError) {
    const { data: debtor } = await supabase
      .from('debtors')
      .select('total_debt')
      .eq('id', payment.debtor_id)
      .eq('pharmacy_id', pharmacyId)
      .single();

    if (debtor) {
      const newDebt = Math.max(0, debtor.total_debt - payment.amount);
      
      await supabase
        .from('debtors')
        .update({ total_debt: newDebt })
        .eq('id', payment.debtor_id)
        .eq('pharmacy_id', pharmacyId);
    }
  }

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
    .eq('pharmacy_id', pharmacyId) // طبقة حماية إضافية لمنع القراءة المتقاطعة
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

  const { data, error } = await supabase
    .from('debtors')
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

