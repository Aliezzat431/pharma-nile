import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { adminKey } = await request.json();

    const serverAdminKey = process.env.ADMIN_KEY || '@2026';

    const keyBuffer = Buffer.from(adminKey || '');
    const serverKeyBuffer = Buffer.from(serverAdminKey);

    if (keyBuffer.length !== serverKeyBuffer.length) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const isMatch = crypto.timingSafeEqual(keyBuffer, serverKeyBuffer);

    if (isMatch) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false }, { status: 401 });
    
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Malformed JSON' }, { status: 400 });
  }
}
