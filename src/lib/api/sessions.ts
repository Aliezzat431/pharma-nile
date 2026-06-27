import { supabase } from '../supabase';

export interface Session {
  id: string;
  user_id: string;
  username: string;
  shift_type: string;
  start_time: string;
  end_time?: string;
  status: 'active' | 'closed';
}

export async function getCurrentActiveSession(userId: string): Promise<Session | null> {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) return null;

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('pharmacy_id', pharmacyId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) return null;
  return data;
}

export async function startShift(userId: string, username: string, shiftType: string) {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) throw new Error("Unauthorized Tenant");

  const { data, error } = await supabase
    .from('sessions')
    .insert([{
      user_id: userId,
      username,
      shift_type: shiftType,
      status: 'active',
      start_time: new Date().toISOString(),
      pharmacy_id: pharmacyId
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function endShift(sessionId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) throw new Error("Unauthorized Tenant");

  const { error } = await supabase
    .from('sessions')
    .update({
      status: 'closed',
      end_time: new Date().toISOString()
    })
    .eq('id', sessionId)
    .eq('pharmacy_id', pharmacyId);

  if (error) throw error;
  return true;
}

