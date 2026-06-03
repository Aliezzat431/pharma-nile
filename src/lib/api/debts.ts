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

/**
 * جلب جميع العملاء المدينين التابعين لصيدلية معينة
 */
export async function getDebtors(pharmacyId: string): Promise<Debtor[]> {
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

/**
 * إضافة عميل ديون جديد وربطه بمعرف الصيدلية
 */
export async function addDebtor(debtorData: {
  name: string;
  phone?: string;
  pharmacy_id: string;
}): Promise<Debtor> {
  const { data, error } = await supabase
    .from('debtors')
    .insert([
      {
        name: debtorData.name,
        phone: debtorData.phone,
        pharmacy_id: debtorData.pharmacy_id,
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

/**
 * تسجيل عملية سداد (جزئي أو كلي) وتحديث مديونية العميل
 */
export async function recordPayment(payment: {
  debtor_id: string;
  pharmacy_id: string;
  amount: number;
  payment_type: 'partial' | 'full';
  note?: string;
}): Promise<DebtPayment> {
  // 1. بدء معاملة لتسجيل حركة السداد
  const { data: paymentData, error: paymentError } = await supabase
    .from('debt_payments')
    .insert([
      {
        debtor_id: payment.debtor_id,
        pharmacy_id: payment.pharmacy_id,
        amount: payment.amount,
        payment_type: payment.payment_type,
        note: payment.note,
      },
    ])
    .select()
    .single();

  if (paymentError) {
    console.error('Error recording debt payment:', paymentError);
    throw paymentError;
  }

  // 2. تحديث الرصيد المتبقي في حساب العميل (خصم القيمة المسددة)
  // في بيئة الإنتاج يفضل استخدام RPC أو Trigger لتجنب مشاكل التزامن،
  // ولكن برمجياً نقوم بالتحديث المباشر هنا لحين بناء الـ SQL Functions:
  const { data: debtor } = await supabase
    .from('debtors')
    .select('total_debt')
    .eq('id', payment.debtor_id)
    .eq('pharmacy_id', payment.pharmacy_id)
    .single();

  if (debtor) {
    const newDebt = Math.max(0, debtor.total_debt - payment.amount);
    
    await supabase
      .from('debtors')
      .update({ total_debt: newDebt })
      .eq('id', payment.debtor_id)
      .eq('pharmacy_id', payment.pharmacy_id);
  }

  // 3. تسجيل معاملة مالية واردة في الخزينة لضبط تقارير الأرباح
  await supabase
    .from('financial_transactions')
    .insert([
      {
        pharmacy_id: payment.pharmacy_id,
        type: 'revenue',
        amount: payment.amount,
        source: 'debt_collection',
        description: `تحصيل مديونية - عميل رقم #${payment.debtor_id.substring(0, 5)}`,
      }
    ]);

  return paymentData;
}

/**
 * جلب سجل السداد الخاص بعميل محدد داخل الصيدلية لضمان الأمان
 */
export async function getPaymentHistory(
  debtorId: string,
  pharmacyId: string
): Promise<DebtPayment[]> {
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
      
