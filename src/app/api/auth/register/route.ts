import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase Admin Client using service_role key
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase environment variables are missing');
  }
  
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      full_name,
      regType, // 'join' | 'create'
      selectedPharmacyId, // For 'join'
      newPharmacyName, // For 'create'
      newPharmacyAddress, // For 'create'
      newPharmacyPhone, // For 'create'
      createChain, // boolean
      chainId, // For 'create' under existing chain
      chainName, // For creating new chain
      chainPassword, // For creating new chain or verifying existing chain before branch insertion
    } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'البريد الإلكتروني، كلمة المرور، والاسم الكامل مطلوبة' }, { status: 400 });
    }

    const adminSupabase = getSupabaseAdmin();

    // 1. Check if email is already taken in auth
    const { data: { users }, error: listError } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 });
    if (listError) {
      return NextResponse.json({ error: 'حدث خطأ أثناء فحص الحساب المكرر' }, { status: 500 });
    }
    const emailExists = users.some(u => u.email?.toLowerCase() === email.trim().toLowerCase());
    if (emailExists) {
      return NextResponse.json({ error: 'البريد الإلكتروني هذا مسجل بالفعل بالمنظومة' }, { status: 409 });
    }

    let targetPharmacyId = selectedPharmacyId;
    let targetChainId = chainId || null;

    // 2. Handle Pharmacy/Chain Creation
    if (regType === 'create') {
      if (!newPharmacyName?.trim()) {
        return NextResponse.json({ error: 'اسم الصيدلية الجديدة مطلوب' }, { status: 400 });
      }

      // If user wants to create a new chain
      if (createChain) {
        if (!chainName?.trim() || !chainPassword?.trim()) {
          return NextResponse.json({ error: 'اسم السلسلة ورمز المرور مطلوبان لإنشاء السلسلة' }, { status: 400 });
        }

        // Check if chain name already exists
        const { data: existingChain, error: chainCheckErr } = await adminSupabase
          .from('chains')
          .select('id')
          .eq('name', chainName.trim())
          .maybeSingle();

        if (chainCheckErr) {
          return NextResponse.json({ error: 'حدث خطأ أثناء التحقق من السلسلة' }, { status: 500 });
        }
        if (existingChain) {
          return NextResponse.json({ error: 'اسم هذه السلسلة مسجل بالفعل بقاعدة البيانات' }, { status: 409 });
        }

        // Create new chain
        const { data: newChain, error: chainCreateErr } = await adminSupabase
          .from('chains')
          .insert({
            name: chainName.trim(),
            password: chainPassword.trim(),
          })
          .select()
          .single();

        if (chainCreateErr || !newChain) {
          return NextResponse.json({ error: `فشل إنشاء السلسلة: ${chainCreateErr?.message}` }, { status: 500 });
        }

        targetChainId = newChain.id;
      } else if (targetChainId) {
        // If creating branch in an existing chain, we MUST verify the chain password first
        if (!chainPassword) {
          return NextResponse.json({ error: 'رمز مرور السلسلة مطلوب لإضافة فرع إليها' }, { status: 400 });
        }

        const { data: isValid, error: verifyErr } = await adminSupabase.rpc('verify_chain_password', {
          p_chain_id: targetChainId,
          p_password: chainPassword
        });

        if (verifyErr || !isValid) {
          return NextResponse.json({ error: 'رمز مرور السلسلة غير صحيح، لا يمكن إضافة فرع' }, { status: 403 });
        }
      }

      // Create new pharmacy branch
      const { data: newPharmacy, error: pharmacyCreateErr } = await adminSupabase
        .from('pharmacies')
        .insert({
          name: newPharmacyName.trim(),
          address: newPharmacyAddress?.trim() || null,
          phone: newPharmacyPhone?.trim() || null,
          chain_id: targetChainId,
          is_active: true
        })
        .select()
        .single();

      if (pharmacyCreateErr || !newPharmacy) {
        // If chain was created but pharmacy failed, we theoretically have an orphan chain, but we throw error
        return NextResponse.json({ error: `فشل إنشاء فرع الصيدلية: ${pharmacyCreateErr?.message}` }, { status: 500 });
      }

      targetPharmacyId = newPharmacy.id;
    } else {
      // Joining an existing pharmacy branch
      if (!targetPharmacyId) {
        return NextResponse.json({ error: 'الرجاء تحديد الصيدلية المراد الانضمام إليها' }, { status: 400 });
      }

      // Automatically resolve secondary/primary chain_id for join
      const { data: targetPharm, error: fetchBranchErr } = await adminSupabase
        .from('pharmacies')
        .select('chain_id')
        .eq('id', targetPharmacyId)
        .maybeSingle();

      if (fetchBranchErr || !targetPharm) {
        return NextResponse.json({ error: 'لم يتم العثور على الصيدلية المحددة' }, { status: 404 });
      }
      targetChainId = targetPharm.chain_id;
    }

    // 3. Create Supabase Auth User with metadata
    const userRole = regType === 'create' ? 'admin' : 'staff';
    const { data: newUser, error: createAuthErr } = await adminSupabase.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true, // Auto confirm for seamless setup
      user_metadata: {
        full_name: full_name.trim(),
        role: userRole,
        pharmacy_id: targetPharmacyId,
        chain_id: targetChainId
      }
    });

    if (createAuthErr || !newUser.user) {
      return NextResponse.json({ error: createAuthErr?.message || 'فشل إنشاء حساب المستخدم' }, { status: 500 });
    }

    const newUserId = newUser.user.id;

    // If createChain, update chain owner_id & owner_email
    if (regType === 'create' && createChain && targetChainId) {
      await adminSupabase
        .from('chains')
        .update({
          owner_id: newUserId,
          owner_email: email.trim()
        })
        .eq('id', targetChainId);
    }

    // Explicitly seed user_pharmacy_access for creators/joiners to ensure correct RLS context
    await adminSupabase.from('user_pharmacy_access').insert({
      user_id: newUserId,
      pharmacy_id: targetPharmacyId,
      role: userRole,
      is_primary: true
    });

    return NextResponse.json({
      success: true,
      message: 'تم تسجيل الحساب بنجاح',
      user: {
        id: newUserId,
        email: email.trim(),
        role: userRole
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('[Registration API Error]:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ داخلي بالخادم' }, { status: 500 });
  }
}
