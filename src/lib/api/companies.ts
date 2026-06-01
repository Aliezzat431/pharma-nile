import { supabase } from '../supabase';

export interface Company {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at?: string;
}

export async function getCompanies() {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching companies:', error);
    return [];
  }
  return data as Company[];
}

export async function addCompany(company: Omit<Company, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('companies')
    .insert([company])
    .select()
    .single();

  if (error) {
    console.error('Error adding company:', error);
    throw error;
  }
  return data as Company;
}

export async function updateCompany(id: string, updates: Partial<Company>) {
  const { data, error } = await supabase
    .from('companies')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating company:', error);
    throw error;
  }
  return data as Company;
}

export async function deleteCompany(id: string) {
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting company:', error);
    throw error;
  }
}
