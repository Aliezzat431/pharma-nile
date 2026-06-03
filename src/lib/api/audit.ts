import { supabase } from '../supabase';

export interface AuditLog {
  id: string;
  pharmacy_id: string; // ✅ ربط السجل بالصيدلية
  user_id: string;
  username: string;
  action: string;
  target_type: string;
  target_id?: string;
  details?: any;
  created_at: string;
}

/**
 * تسجيل عملية جديدة في نظام الرقابة والأمان
 * تم إجبار تمرير الـ pharmacy_id لحصر اللوج داخل صيدلية واحدة
 */
export async function logAction(
  log: Omit<AuditLog, 'id' | 'created_at' | 'user_id' | 'username'> & {
    pharmacy_id: string;
  }
) {
  // 🔐 جلب بيانات المستخدم الحالية مباشرة من جلسة Supabase الآمنة (Server/Session Auth)
  // لضمان عدم قيام أي موظف بتزوير اسم المستخدم أو المعرف أثناء تسجيل اللوج
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('Unauthorized audit log attempt');
    return;
  }

  const username = user.user_metadata?.username || user.email || 'مستخدم غير معروف';

  const { error } = await supabase
    .from('audit_logs')
    .insert([
      {
        ...log,
        user_id: user.id, // تثبيت المعرف الحقيقي من السيرفر
        username: username, // تثبيت الاسم الحقيقي من السيرفر
      }
    ]);

  if (error) {
    console.error('Error logging action:', error);
  }
}

/**
 * جلب سجلات الرقابة والعمليات الخاصة بصيدلية معينة فقط
 */
export async function getAuditLogs(pharmacyId: string, limit = 100): Promise<AuditLog[]> {
  if (!pharmacyId) return [];

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('pharmacy_id', pharmacyId) // 🔒 منع تداخل سجلات الرقابة بين الصيدليات
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
  
  return data as AuditLog[];
}
