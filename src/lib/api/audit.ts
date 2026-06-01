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
}

export async function logAction(log: Omit<AuditLog, 'id' | 'created_at'>) {
  const { error } = await supabase
    .from('audit_logs')
    .insert([log]);

  if (error) {
    console.error('Error logging action:', error);
  }
}

export async function getAuditLogs(limit = 100) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
  return data as AuditLog[];
}
