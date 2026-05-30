import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { adminKey } = await request.json();
  
  const serverAdminKey = process.env.ADMIN_KEY || '@2026';
  
  if (adminKey === serverAdminKey) {
    return NextResponse.json({ success: true });
  }
  
  return NextResponse.json({ success: false }, { status: 401 });
}
