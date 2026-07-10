import { supabase } from '../supabase';

export interface Company {
  id: string;
  pharmacy_id: string; 
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at?: string;
}


export async function getCompanies(): Promise<Company[]> {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) return [];

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('pharmacy_id', pharmacyId) 
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching companies:', error);
    return [];
  }
  return data as Company[];
}


export async function addCompany(company: Omit<Company, 'id' | 'created_at' | 'pharmacy_id'>): Promise<Company> {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) throw new Error("Unauthorized Tenant");

  const { data, error } = await supabase
    .from('companies')
    .insert([{ ...company, pharmacy_id: pharmacyId }])
    .select()
    .maybeSingle(); 

  if (error) {
    console.error('Error adding company:', error);
    throw error;
  }
  if (!data) throw new Error('فشل إنشاء الشركة. تحقق من الصلاحيات.');
  return data as Company;
}


export async function updateCompany(id: string, updates: Partial<Omit<Company, 'id' | 'pharmacy_id' | 'created_at'>>): Promise<Company> {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) throw new Error("Unauthorized Tenant");

  const { data, error } = await supabase
    .from('companies')
    .update(updates)
    .eq('id', id)
    .eq('pharmacy_id', pharmacyId) 
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating company:', error);
    throw error;
  }
  return data as Company;
}


export async function deleteCompany(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) throw new Error("Unauthorized Tenant");

  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', id)
    .eq('pharmacy_id', pharmacyId); 

  if (error) {
    console.error('Error deleting company:', error);
    throw error;
  }
}

