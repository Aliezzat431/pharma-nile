import { supabase } from '../supabase';

export interface UserProfile {
  id: string;
  role: 'admin' | 'staff';
  full_name?: string;
  created_at: string;
  salary?: number;
  incentives?: number;
}

export async function getAllStaff() {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) return [];

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('pharmacy_id', pharmacyId) // 🔒 Isolation
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching staff:', error);
    return [];
  }
  return data as UserProfile[];
}

export async function updateStaffRole(userId: string, role: 'admin' | 'staff') {
  const { error } = await supabase
    .from('user_profiles')
    .update({ role })
    .eq('id', userId);

  if (error) {
    console.error('Error updating staff role:', error);
    throw error;
  }
}

