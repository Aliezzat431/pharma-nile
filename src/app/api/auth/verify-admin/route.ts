import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { adminKey } = await request.json();

    // جلب المفتاح من البيئة أو استخدام المفتاح الافتراضي
    const serverAdminKey = process.env.ADMIN_KEY || '@2026';

    // 1. تحويل النصوص إلى Buffer لتتمكن دالة crypto من مقارنتها
    const keyBuffer = Buffer.from(adminKey || '');
    const serverKeyBuffer = Buffer.from(serverAdminKey);

    // 2. يجب أن تكون الأطوال متساوية قبل المقارنة الآمنة لتجنب أخطاء الحجم
    if (keyBuffer.length !== serverKeyBuffer.length) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    // 3. المقارنة في زمن ثابت (Constant Time Comparison) لمنع الـ Timing Attacks
    const isMatch = crypto.timingSafeEqual(keyBuffer, serverKeyBuffer);

    if (isMatch) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false }, { status: 401 });
    
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Malformed JSON' }, { status: 400 });
  }
}