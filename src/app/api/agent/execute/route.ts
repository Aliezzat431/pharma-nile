import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side client with Service Role for administrative actions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { actionType, payload, isUndo = false } = body;
    
    if (!actionType || !payload || !payload.table) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const tableName = payload.table;
    const dataToExecute = payload.data;
    const recordId = dataToExecute?.id || null;

    // Handle UNDO specifically
    if (isUndo) {
      const { logId } = body;
      const { data: log } = await supabase.from('agent_action_logs').select('*').eq('id', logId).single();
      
      if (!log) throw new Error("Undo log not found");

      let undoResult;
      if (log.action_type === 'INSERT') {
        undoResult = await supabase.from(log.table_name).delete().eq('id', log.new_payload.id);
      } else if (log.action_type === 'UPDATE' || log.action_type === 'DELETE') {
        undoResult = await supabase.from(log.table_name).upsert(log.previous_payload);
      }

      if (undoResult?.error) throw undoResult.error;

      await supabase.from('agent_action_logs').update({ undone: true }).eq('id', logId);
      
      return NextResponse.json({ reply: 'تم التراجع عن العملية بنجاح. زي ما كنت بالظبط!' });
    }

    // NORMAL EXECUTION
    let previousPayload = null;
    if ((actionType === 'UPDATE' || actionType === 'DELETE') && recordId) {
      const { data: prevData } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', recordId)
        .single();
      
      previousPayload = prevData;
    }

    let result;
    if (actionType === 'UPDATE') {
      result = await supabase.from(tableName).update(dataToExecute).eq('id', recordId);
    } else if (actionType === 'DELETE') {
      result = await supabase.from(tableName).delete().eq('id', recordId);
    } else if (actionType === 'INSERT') {
      result = await supabase.from(tableName).insert(dataToExecute).select().single();
    }

    if (result?.error) throw result.error;

    // Log the action for UNDO
    await supabase.from('agent_action_logs').insert({
      action_type: actionType,
      table_name: tableName,
      record_id: recordId || (actionType === 'INSERT' ? result.data.id : null),
      previous_payload: previousPayload,
      new_payload: dataToExecute,
    });

    return NextResponse.json({
      reply: 'تمام يا فندم، نفذت العملية وسجلتها عندي لو حبيت ترجع فيها في أي وقت.'
    });

  } catch (error: any) {
    console.error('Agent execution error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
