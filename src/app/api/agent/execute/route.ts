import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// تهيئة عميل Supabase باستخدام مفتاح صيانة الخدمة (Service Role) لتخطي سياسات الـ RLS عند الحاجة
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { actionType, payload, isUndo = false } = body;

    // التحقق الأولي من سلامة البيانات المرسلة
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
    // ملاحظة: في الـ DELETE غالباً ما يتم إرسال id السجل فقط بدون كائن data كامل

    // ==========================================
    // ↩️ عمليات التراجع (UNDO)
    // ==========================================
    if (isUndo) {
      const { logId } = body;

      if (!logId) {
        return NextResponse.json({ error: 'Missing logId for undo operation' }, { status: 400 });
      }

      // جلب سجل العملية السابقة من جدول الـ Logs
      const { data: log, error: logError } = await supabase
        .from('agent_action_logs')
        .select('*')
        .eq('id', logId)
        .single();

      if (logError) throw logError;
      if (!log) throw new Error('Undo log not found');
      if (log.undone) {
        return NextResponse.json({ reply: 'تم التراجع عن هذه العملية بالفعل سابقاً!' });
      }

      let undoResult: { error: any } | null = null;

      if (log.action_type === 'INSERT') {
        // التراجع عن الإدخال = حذف السجل الذي تم إنشاؤه
        const targetId = log.record_id || log.new_payload?.id;
        if (!targetId) throw new Error('Missing record ID for undoing INSERT');

        undoResult = await supabase
          .from(log.table_name)
          .delete()
          .eq('id', targetId);
      } 
      else if (log.action_type === 'UPDATE' || log.action_type === 'DELETE') {
        // التراجع عن التعديل أو الحذف = إعادة البيانات القديمة كاملة (Upsert)
        if (!log.previous_payload) throw new Error('Missing previous payload to restore data');
        
        undoResult = await supabase
          .from(log.table_name)
          .upsert(log.previous_payload);
      }

      if (undoResult?.error) throw undoResult.error;

      // تحديث حالة السجل الحالي بأنه تم التراجع عنه بنجاح
      await supabase
        .from('agent_action_logs')
        .update({ undone: true })
        .eq('id', logId);

      return NextResponse.json({
        reply: 'تم التراجع عن العملية بنجاح. زي ما كنت بالظبط!',
      });
    }

    // ==========================================
    // 🔍 جلب البيانات السابقة قبل التعديل/الحذف
    // ==========================================
    let previousPayload = null;

    if ((actionType === 'UPDATE' || actionType === 'DELETE') && recordId) {
      const { data: prevData, error: prevError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', recordId)
        .maybeSingle(); // استخدام maybeSingle لتفادي الأخطاء في حال عدم وجود السجل

      if (prevError) throw prevError;
      previousPayload = prevData;
    }

    // ==========================================
    // ⚡ تنفيذ العملية الأساسية (EXECUTE ACTION)
    // ==========================================
    let resultData: any = null;
    let executionError: any = null;

    if (actionType === 'UPDATE') {
      if (!recordId) throw new Error('Missing record ID for UPDATE operation');
      
      const { data, error } = await supabase
        .from(tableName)
        .update(dataToExecute)
        .eq('id', recordId)
        .select()
        .maybeSingle(); // أضفنا select لجلب السجل المحدث بالكامل
      
      resultData = data;
      executionError = error;
    } 
    else if (actionType === 'DELETE') {
      if (!recordId) throw new Error('Missing record ID for DELETE operation');
      
      const { data, error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', recordId)
        .select()
        .maybeSingle(); // أضفنا select هنا أيضاً لتوثيق الحذف
        
      resultData = data;
      executionError = error;
    } 
    else if (actionType === 'INSERT') {
      const { data, error } = await supabase
        .from(tableName)
        .insert(dataToExecute)
        .select()
        .maybeSingle();
        
      resultData = data;
      executionError = error;
    }

    if (executionError) throw executionError;

    // تحديد المعرف النهائي للسجل المتأثر لتوثيقه في السجلات
    const finalRecordId = recordId || resultData?.id || null;

    // ==========================================
    // 📝 تدوين السجلات (LOG ACTION)
    // ==========================================
    const { error: logInsertError } = await supabase
      .from('agent_action_logs')
      .insert({
        action_type: actionType,
        table_name: tableName,
        record_id: finalRecordId,
        previous_payload: previousPayload,
        new_payload: actionType === 'DELETE' ? null : (resultData || dataToExecute), 
        undone: false
      });

    if (logInsertError) {
      console.error('Failed to write agent log:', logInsertError);
      // اختياري: يمكنك اختيار تمرير العملية حتى لو فشل السجل أو إلقاء خطأ كما فعلت أنت
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