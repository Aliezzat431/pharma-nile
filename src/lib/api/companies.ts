import { supabase } from '../supabase';

export interface Company {
  id: string;
  pharmacy_id: string; // ✅ ربط الشركة بالصيدلية المحددة
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at?: string;
}

/**
 * جلب شركات التوزيع الخاصة بصيدلية معينة فقط
 */
export async function getCompanies(pharmacyId: string): Promise<Company[]> {
  if (!pharmacyId) return [];

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('pharmacy_id', pharmacyId) // 🔒 حصر الجلب للـ Tenant الحالي
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching companies:', error);
    return [];
  }
  return data as Company[];
}

/**
 * إضافة شركة توزيع جديدة وربطها بالصيدلية
 */
export async function addCompany(
  company: Omit<Company, 'id' | 'created_at'>
): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    .insert([company]) // الكائن المرسل من الفرونت يجب أن يحتوي على pharmacy_id مسبقاً
    .select()
    .single();

  if (error) {
    console.error('Error adding company:', error);
    throw error;
  }
  return data as Company;
}

/**
 * تحديث بيانات شركة مع التحقق من ملكية الصيدلية لها (حماية الـ Mutation)
 */
export async function updateCompany(
  id: string, 
  pharmacyId: string, // ✅ تمرير المعرف لمنع تحديث شركات الغير عبر التلاعب بالـ ID
  updates: Partial<Omit<Company, 'id' | 'pharmacy_id' | 'created_at'>>
): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    .update(updates)
    .eq('id', id)
    .eq('pharmacy_id', pharmacyId) // 🔒 طبقة الأمان الثنائية
    .select()
    .single();

  if (error) {
    console.error('Error updating company:', error);
    throw error;
  }
  return data as Company;
}

/**
 * حذف شركة توزيع معينة تابعة للصيدلية
 */
export async function deleteCompany(id: string, pharmacyId: string): Promise<void> {
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', id)
    .eq('pharmacy_id', pharmacyId); // 🔒 ضمان عدم حذف الموظف لشركة تابعة لصيدلية أخرى

  if (error) {
    console.error('Error deleting company:', error);
    throw error;
  }
}
