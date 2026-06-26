import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { staffCreateSchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const rawData = await request.json();
    
    // Zod Validation 
    const validationResult = staffCreateSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation Error', details: validationResult.error.format() }, 
        { status: 400 }
      );
    }
    
    const { email, password, full_name, role, salary, incentives } = validationResult.data;

    const supabaseUserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const { data: currentUserProfile, error: profileCheckError } = await supabaseUserClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileCheckError || currentUserProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only administrators can create staff accounts' }, { status: 403 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });

    if (authError) throw authError;

    const finalRole = role === 'admin' ? 'admin' : 'staff';

    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: authData.user.id,
        full_name,
        role: finalRole,
        salary,
        incentives
      });


    if (profileError) throw profileError;

    return NextResponse.json({ success: true, user: authData.user });

  } catch (error: any) {
    console.error('Error creating staff:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
