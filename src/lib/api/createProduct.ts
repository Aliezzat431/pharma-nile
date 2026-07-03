import { supabase } from '../supabase';

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE-LEVEL DEFENSE-IN-DEPTH NOTE
// ─────────────────────────────────────────────────────────────────────────────
// Even if this function is somehow called with a tampered pharmacyId, all DB
// writes are protected by Row Level Security policies in Supabase:
//
//   products INSERT policy: WITH CHECK (pharmacy_id = get_my_pharmacy_id())
//   batches  INSERT policy: WITH CHECK (pharmacy_id = get_my_pharmacy_id())
//
// The `get_my_pharmacy_id()` DB function (SECURITY DEFINER) resolves the
// caller's true pharmacy from their JWT, then falls back to user_pharmacy_access.
// It runs inside the DB with no way for the client to override it.
//
// RLS is the last line of defense; application-layer auth below is the first.
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateProductInput {
  name: string;
  type: string;
  company: string;
  unit: string;
  unit_conversion: number;
  inventory_method: string;
  barcode: string;
  quantity: number;
  purchase_price: number;
  sale_price: number;
  expiry_date: string;
  // pharmacy_id intentionally omitted — derived exclusively from DB auth.
  // Accepting it from the caller would allow cross-tenant privilege escalation.
}

/**
 * Resolves the caller's primary pharmacy ID from the `user_pharmacy_access`
 * table (is_primary = true), using the authenticated user's ID from the JWT.
 *
 * This is authoritative: the row exists only if the DB trigger inserted it
 * during user registration, and the RLS policy (user_id = auth.uid()) prevents
 * any user from reading or spoofing another user's access row.
 *
 * Returns `null` if the user has no primary pharmacy access record.
 */
async function resolvePrimaryPharmacyId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_pharmacy_access')
    .select('pharmacy_id')
    .eq('user_id', userId)          // scoped to this user (RLS also enforces this)
    .eq('is_primary', true)         // primary pharmacy only
    .maybeSingle();                 // safe — no PGRST116 if no row found

  if (error) {
    console.error('[createProduct] user_pharmacy_access lookup failed:', error.message);
    return null;
  }

  return data?.pharmacy_id ?? null;
}

export async function createProductWithBatch(input: CreateProductInput) {
  // ── Step 1: Authenticate ─────────────────────────────────────────────────
  // getUser() verifies the JWT with Supabase Auth servers — it cannot be
  // spoofed by modifying localStorage or cookies client-side.
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: new Error('Unauthorized: Authentication required.') };
  }

  // ── Step 2: Resolve pharmacy from DB (not from JWT metadata or caller) ───
  // We do NOT read user_metadata.pharmacy_id here because that value:
  //   (a) can become stale after account changes
  //   (b) is embedded in the JWT and not re-verified on every call
  //   (c) was previously writable via auth.updateUser() — a removed attack vector
  //
  // Instead we read user_pharmacy_access, which is:
  //   - Written only by the DB trigger on user registration
  //   - Protected by RLS: SELECT only allowed where user_id = auth.uid()
  //   - Immutable from the client-side Supabase JS SDK
  const pharmacyId = await resolvePrimaryPharmacyId(user.id);

  if (!pharmacyId) {
    return {
      success: false,
      error: new Error(
        'Unauthorized: No primary pharmacy linked to this account. ' +
        'Contact your administrator.'
      ),
    };
  }

  // ── Step 3: Validate input ───────────────────────────────────────────────
  const trimmedName    = input.name.trim();
  const trimmedCompany = input.company.trim();

  if (!trimmedName || !trimmedCompany) {
    return { success: false, error: new Error('Validation Error: Product name and company cannot be empty.') };
  }

  if (trimmedName.length > 150 || trimmedCompany.length > 150) {
    return { success: false, error: new Error('Validation Error: Text input exceeds maximum allowed length.') };
  }

  const htmlRegex = /<[^>]*>?/gm;
  if (htmlRegex.test(trimmedName) || htmlRegex.test(trimmedCompany)) {
    return { success: false, error: new Error('Validation Error: Invalid characters detected.') };
  }

  if (
    input.quantity < 0 ||
    input.purchase_price < 0 ||
    input.sale_price < 0 ||
    input.unit_conversion <= 0
  ) {
    return {
      success: false,
      error: new Error(
        'Validation Error: Quantity and prices cannot be negative; unit conversion must be positive.'
      ),
    };
  }

  // ── Step 4: Insert product ───────────────────────────────────────────────
  // The DB RLS policy "products_insert" enforces:
  //   WITH CHECK (pharmacy_id = get_my_pharmacy_id())
  // so even if pharmacyId were wrong here, the DB would reject the insert.
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert([
      {
        name:             trimmedName,
        type:             input.type,
        company:          trimmedCompany,
        unit:             input.unit,
        unit_conversion:  input.unit_conversion,
        inventory_method: input.inventory_method,
        pharmacy_id:      pharmacyId,   // 🔒 DB-resolved, never caller-supplied
      },
    ])
    .select()
    .maybeSingle(); // ✅ safe — avoids PGRST116 if RLS silently blocks the insert

  if (productError) {
    console.error('[createProduct] Product insert failed:', productError.message);
    return { success: false, error: productError };
  }
  if (!product) {
    return { success: false, error: new Error('فشل إنشاء المنتج — تحقق من الصلاحيات.') };
  }

  // ── Step 5: Insert initial batch ─────────────────────────────────────────
  // The DB RLS policy "batches_insert" enforces:
  //   WITH CHECK (pharmacy_id = get_my_pharmacy_id())
  const { error: batchError } = await supabase
    .from('batches')
    .insert([
      {
        product_id:     product.id,
        barcode:        input.barcode,
        quantity:       input.quantity,
        purchase_price: input.purchase_price,
        sale_price:     input.sale_price,
        expiry_date:    input.expiry_date,
        pharmacy_id:    pharmacyId,     // 🔒 DB-resolved, never caller-supplied
      },
    ]);

  if (batchError) {
    console.error('[createProduct] Batch insert failed:', batchError.message);
    // 🧹 Rollback: delete the orphaned product to keep the DB consistent.
    // The RLS "products_delete" policy further scopes this to our pharmacy.
    await supabase
      .from('products')
      .delete()
      .eq('id', product.id)
      .eq('pharmacy_id', pharmacyId);
    return { success: false, error: batchError };
  }

  return { success: true, data: product };
}
