import { supabase } from '../supabase';

export interface AuditLog {
  id: string;
  user_id: string;
  username: string;
  action: string;
  target_type: string;
  target_id?: string;
  details?: any;
  created_at: string;
  pharmacy_id?: string;
}

export async function logAction(log: Omit<AuditLog, 'id' | 'created_at' | 'pharmacy_id'>) {
  // Enforce server-side identity
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('Audit Log failed: Unauthenticated user');
    return;
  }
  const pharmacyId = user.user_metadata?.pharmacy_id;
  if (!pharmacyId) return;

  const { error } = await supabase
    .from('audit_logs')
    .insert([{ ...log, pharmacy_id: pharmacyId }]);

  if (error) {
    console.error('Error logging action:', error);
  }
}

export async function getAuditLogs(limit = 100) {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) return [];

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
  return data as AuditLog[];
}
