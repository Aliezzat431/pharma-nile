import { PostgrestError } from '@supabase/supabase-js';

export function handleDBError(error: unknown, fallbackMessage = 'حدث خطأ في قاعدة البيانات. برجاء المحاولة لاحقاً.'): never {
  console.error('[DB Error]', error);

  if (typeof error === 'object' && error !== null) {
    const pgError = error as PostgrestError;

    
    if (pgError.code === '40P01') {
      throw new Error('يوجد تعارض في التحديث السريع. الرجاء الانتظار قليلاً والمحاولة مرة أخرى.');
    }
    
    if (pgError.code === '23505') {
      throw new Error('هذا السجل موجود مسبقاً (تعارض في البيانات).');
    }
    
    if (pgError.code === '23503') {
      throw new Error('العملية مرفوضة: البيانات المطلوبة مرتبطة بسجلات أخرى.');
    }
    
    if (pgError.code === '57014' || pgError.code === '53300') {
      throw new Error('الاتصال بقاعدة البيانات بطيء جداً، أو يوجد ضغط. الرجاء المحاولة لاحقاً.');
    }
    
    
    if (pgError.message && !pgError.message.includes('relation') && !pgError.message.includes('syntax')) {
      
    }
  }

  if (error instanceof Error && !error.message.includes('relation')) {
    throw error;
  }

  throw new Error(fallbackMessage);
}
