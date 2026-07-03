import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { actionType, payload, isUndo = false } = body;

    if (!actionType || !payload || !payload.table) {
      return NextResponse.json(
        { error: 'Invalid payload. "actionType" and "payload.table" are required.' },
        { status: 400 }
      );
    }

    const allowedActions = ['INSERT', 'UPDATE', 'DELETE'];
    if (!allowedActions.includes(actionType)) {
      return NextResponse.json(
        { error: 'Unsupported action type. Allowed: INSERT, UPDATE, DELETE' },
        { status: 400 }
      );
    }

    const tableName = payload.table;
    const dataToExecute = payload.data;
    const recordId = dataToExecute?.id || payload.id || null; 

    // ── 1. Secure Authentication & Authorization ────────────────────────────
    const authHeader = req.headers.get('Authorization');
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader?.replace('Bearer ', ''));

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Authentication required" }, { status: 401 });
    }

    // ── 2. Derive Tenant Context securely from DB ───────────────────────────
    const { data: accessData } = await supabase
      .from('user_pharmacy_access')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .maybeSingle();

    const pharmacyId = accessData?.pharmacy_id;

    if (!pharmacyId) {
      return NextResponse.json({ error: "Unauthorized: No primary pharmacy context found" }, { status: 401 });
    }

    // ── 3. Undo Execution Flow (Scoped with Pharmacy ID Verification) ───────
    if (isUndo) {
      const { logId } = body;

      if (!logId) {
        return NextResponse.json({ error: 'Missing logId for undo operation' }, { status: 400 });
      }

      // Retrieve the log log entry, validating it belongs to the caller's pharmacy
      const { data: log, error: logError } = await supabase
        .from('agent_action_logs')
        .select('*')
        .eq('id', logId)
        .eq('pharmacy_id', pharmacyId) // 🔒 Enforce tenant isolation
        .maybeSingle();

      if (logError) throw logError;
      if (!log) {
        return NextResponse.json(
          { error: 'سجل العملية المطلوب التراجع عنها غير موجود في صيدليتك.' },
          { status: 404 }
        );
      }
      if (log.undone) {
        return NextResponse.json({ reply: 'تم التراجع عن هذه العملية بالفعل سابقاً!' });
      }

      let undoResult: { error: any } | null = null;

      if (log.action_type === 'INSERT') {
        const targetId = log.record_id || log.new_payload?.id;
        if (!targetId) throw new Error('Missing record ID for undoing INSERT');

        // Delete the inserted row, scoped to the caller's pharmacy
        undoResult = await supabase
          .from(log.table_name)
          .delete()
          .eq('id', targetId)
          .eq('pharmacy_id', pharmacyId); // 🔒 Scoped delete
      } 
      else if (log.action_type === 'UPDATE' || log.action_type === 'DELETE') {
        if (!log.previous_payload) throw new Error('Missing previous payload to restore data');
        
        // Restore row, enforcing pharmacy_id match in payload
        const restorePayload = { ...log.previous_payload, pharmacy_id: pharmacyId };
        
        undoResult = await supabase
          .from(log.table_name)
          .upsert(restorePayload);
      }

      if (undoResult?.error) throw undoResult.error;

      await supabase
        .from('agent_action_logs')
        .update({ undone: true })
        .eq('id', logId)
        .eq('pharmacy_id', pharmacyId); // 🔒 Scoped update

      return NextResponse.json({
        reply: 'تم التراجع عن العملية بنجاح. زي ما كنت بالظبط!',
      });
    }

    // ── 4. Standard Action Execution Flow ──────────────────────────────────
    let previousPayload = null;

    // For UPDATE or DELETE, load previous state and verify ownership
    if ((actionType === 'UPDATE' || actionType === 'DELETE') && recordId) {
      const { data: prevData, error: prevError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', recordId)
        .eq('pharmacy_id', pharmacyId) // 🔒 Enforce pharmacy ownership for loading state
        .maybeSingle();

      if (prevError) throw prevError;
      if (!prevData) {
        return NextResponse.json({ error: "Unauthorized: Record does not belong to this pharmacy" }, { status: 403 });
      }
      previousPayload = prevData;
    }

    let resultData: any = null;
    let executionError: any = null;

    if (actionType === 'UPDATE') {
      if (!recordId) throw new Error('Missing record ID for UPDATE operation');
      
      const { data, error } = await supabase
        .from(tableName)
        .update({ ...dataToExecute, pharmacy_id: pharmacyId }) // 🔒 Enforce pharmacyId
        .eq('id', recordId)
        .eq('pharmacy_id', pharmacyId) // 🔒 Scoped update
        .select()
        .maybeSingle();
      
      resultData = data;
      executionError = error;
    } 
    else if (actionType === 'DELETE') {
      if (!recordId) throw new Error('Missing record ID for DELETE operation');
      
      const { data, error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', recordId)
        .eq('pharmacy_id', pharmacyId) // 🔒 Scoped delete
        .select()
        .maybeSingle();
        
      resultData = data;
      executionError = error;
    } 
    else if (actionType === 'INSERT') {
      const { data, error } = await supabase
        .from(tableName)
        .insert({ ...dataToExecute, pharmacy_id: pharmacyId }) // 🔒 Automatically scope insert
        .select()
        .maybeSingle();
        
      resultData = data;
      executionError = error;
    }

    if (executionError) throw executionError;

    const finalRecordId = recordId || resultData?.id || null;

    // ── 5. Log the Action with Pharmacy Scoping ─────────────────────────────
    const { error: logInsertError } = await supabase
      .from('agent_action_logs')
      .insert({
        pharmacy_id: pharmacyId, // 🔒 Save pharmacy ID context in the log log table
        action_type: actionType,
        table_name: tableName,
        record_id: finalRecordId,
        previous_payload: previousPayload,
        new_payload: actionType === 'DELETE' ? null : (resultData || dataToExecute), 
        undone: false
      });

    if (logInsertError) {
      console.error('Failed to write agent log:', logInsertError);
      throw logInsertError;
    }

    return NextResponse.json({
      reply: 'تمام يا فندم، نفذت العملية وسجلتها عندي لو حبيت ترجع فيها في أي وقت.',
    });

  } catch (error: any) {
    console.error('Agent execution error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
