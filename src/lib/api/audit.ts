import { supabase } from '../supabase';

export interface AuditLog {
  id: string;
  pharmacy_id: string;
  user_id: string;
  username: string;
  action: string;
  target_type: string;
  target_id?: string;
  details?: any;
  created_at: string;
}

export async function logAction(
  log: Omit<AuditLog, 'id' | 'created_at' | 'user_id' | 'username' | 'pharmacy_id'>
) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('Unauthorized audit log attempt');
    return;
  }

  const pharmacyId = user.user_metadata?.pharmacy_id;
  if (!pharmacyId) {
    console.error('Audit Log failed: Missing pharmacy_id in user metadata');
    return;
  }

  const username = user.user_metadata?.username || user.email || 'مستخدم غير معروف';

  const { error } = await supabase
    .from('audit_logs')
    .insert([
      {
        ...log,
        pharmacy_id: pharmacyId,
        user_id: user.id,
        username: username,
      }
    ]);

  if (error) {
    console.error('Error logging action:', error);
  }
}

export async function getAuditLogs(limit = 100): Promise<AuditLog[]> {
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

