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
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    const allowedActions = ['INSERT', 'UPDATE', 'DELETE'];

    if (!allowedActions.includes(actionType)) {
      return NextResponse.json(
        { error: 'Unsupported action type' },
        { status: 400 }
      );
    }

    const tableName = payload.table;
    const dataToExecute = payload.data;
    const recordId = dataToExecute?.id || null;

    // =========================
    // UNDO
    // =========================
    if (isUndo) {
      const { logId } = body;

      const { data: log, error: logError } = await supabase
        .from('agent_action_logs')
        .select('*')
        .eq('id', logId)
        .single();

      if (logError) throw logError;
      if (!log) throw new Error('Undo log not found');

      let undoResult:
        | { error: any }
        | null = null;

      if (log.action_type === 'INSERT') {
        if (!log.new_payload?.id) {
          throw new Error('Missing payload id for undo');
        }

        undoResult = await supabase
          .from(log.table_name)
          .delete()
          .eq('id', log.new_payload.id);
      } else if (
        log.action_type === 'UPDATE' ||
        log.action_type === 'DELETE'
      ) {
        undoResult = await supabase
          .from(log.table_name)
          .upsert(log.previous_payload);
      }

      if (undoResult?.error) {
        throw undoResult.error;
      }

      await supabase
        .from('agent_action_logs')
        .update({ undone: true })
        .eq('id', logId);

      return NextResponse.json({
        reply: 'تم التراجع عن العملية بنجاح. زي ما كنت بالظبط!',
      });
    }

    // =========================
    // FETCH PREVIOUS DATA
    // =========================
    let previousPayload = null;

    if (
      (actionType === 'UPDATE' || actionType === 'DELETE') &&
      recordId
    ) {
      const { data: prevData, error: prevError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', recordId)
        .single();

      if (prevError) {
        throw prevError;
      }

      previousPayload = prevData;
    }

    // =========================
    // EXECUTE ACTION
    // =========================
    let result:
      | {
          data: any;
          error: any;
        }
      | undefined;

    if (actionType === 'UPDATE') {
      result = await supabase
        .from(tableName)
        .update(dataToExecute)
        .eq('id', recordId);
    } else if (actionType === 'DELETE') {
      result = await supabase
        .from(tableName)
        .delete()
        .eq('id', recordId);
    } else {
      result = await supabase
        .from(tableName)
        .insert(dataToExecute)
        .select()
        .single();
    }

    if (result?.error) {
      throw result.error;
    }

    const insertedId =
      actionType === 'INSERT'
        ? result?.data?.id ?? null
        : null;

    // =========================
    // LOG ACTION
    // =========================
    const { error: logInsertError } = await supabase
      .from('agent_action_logs')
      .insert({
        action_type: actionType,
        table_name: tableName,
        record_id: recordId || insertedId,
        previous_payload: previousPayload,
        new_payload: dataToExecute,
      });

    if (logInsertError) {
      throw logInsertError;
    }

    return NextResponse.json({
      reply:
        'تمام يا فندم، نفذت العملية وسجلتها عندي لو حبيت ترجع فيها في أي وقت.',
    });
  } catch (error: any) {
    console.error('Agent execution error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Internal Server Error',
      },
      {
        status: 500,
      }
    );
  }
}
