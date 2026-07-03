import { supabase } from '../supabase';
import {
  saveProductsToCache,
  searchLocalCache,
  getLocalProductByBarcode
} from '../supabase/product-cache';

export interface Product {
  id: string;
  name: string;
  type: string;
  unit: string;
  unit_conversion: number;
  company_id: string;
  inventory_method: string;
  total_quantity?: number;
  current_price?: number;
  company?: string;
  barcode?: string;
  activeBatches?: Batch[];
  pharmacy_id?: string;
  pharmacy_name?: string;
}

export interface Batch {
  id: string;
  product_id: string;
  barcode: string;
  quantity: number;
  purchase_price: number;
  sale_price: number;
  expiry_date: string;
  pharmacy_id?: string;
}

// ✅ تم إصلاح القوس المفقود وتحسين منطق البحث مع دعم البحث الفوري المحلي عند انقطاع الاتصال
export async function searchProducts(query: string, pharmacyId: string) {
  if (typeof window !== 'undefined' && !window.navigator.onLine) {
    console.log('[Offline Cache] Searching catalog offline...');
    return searchLocalCache(query, pharmacyId);
  }

  try {
    const words = query.trim().split(/\s+/).filter((w) => w.length >= 2);
    
    let dbQuery = supabase
      .from('products')
      .select(`
        *,
        batches (
          *
        ),
        pharmacy:pharmacies(name)
      `) // ✅ تم إغلاق القوس هنا
      .eq('pharmacy_id', pharmacyId)
      .eq('batches.pharmacy_id', pharmacyId);

    if (words.length > 0) {
      // بناء فلتر OR للكلمات المتعددة
      const filter = words.map((w) => `name.ilike.%${w}%`).join(',');
      dbQuery = dbQuery.or(filter);
    } else {
      dbQuery = dbQuery.ilike('name', `%${query}%`);
    }

    const { data: products, error } = await dbQuery.limit(20);

    if (error) {
      throw error;
    }

    // معالجة البيانات وإضافة الخصائص المحسوبة
    const mapped = products.map((p: any) => {
      const activeBatches = (p.batches || [])
        .filter((b: Batch) => b.quantity > 0)
        .sort((a: Batch, b: Batch) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());

      const current_price = activeBatches.length > 0 ? activeBatches[0].sale_price : 0;
      const total_quantity = activeBatches.reduce((acc: number, b: Batch) => acc + b.quantity, 0);

      return {
        ...p,
        current_price,
        total_quantity,
        activeBatches,
        pharmacy_name: p.pharmacy?.name || 'مجهول'
      };
    });

    // حفظ النتائج في الكاش في الخلفية لتكون متاحة أوفلاين
    if (mapped.length > 0) {
      saveProductsToCache(pharmacyId, mapped as any);
    }

    return mapped;
  } catch (err) {
    console.warn('[Cache Fallback] Search failed, pulling from offline copy:', err);
    return searchLocalCache(query, pharmacyId);
  }
}

export async function getProducts(pharmacyId: string) {
  if (!pharmacyId || pharmacyId === 'undefined' || pharmacyId === 'null') return [];

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('pharmacy_id', pharmacyId);

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  return products || [];
}

export async function getProductByBarcode(barcode: string, pharmacyId: string) {
  if (typeof window !== 'undefined' && !window.navigator.onLine) {
    console.log('[Offline Cache] Looking up barcode offline...');
    return getLocalProductByBarcode(barcode, pharmacyId);
  }

  try {
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('id, product_id')
      .eq('barcode', barcode)
      .eq('pharmacy_id', pharmacyId)
      .gt('quantity', 0)
      .maybeSingle(); // ✅ استخدام maybeSingle بدلاً من single لتجنب الخطأ لو مفيش نتائج

    if (batchError || !batch) return null;

    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        batches (*)
      `)
      .eq('id', batch.product_id)
      .eq('pharmacy_id', pharmacyId)
      .limit(1)
      .maybeSingle(); // ✅ safe — product may have been deleted after batch lookup

    if (error || !products) return null;

    const p = products as any;
    const activeBatches = (p.batches || [])
      .filter((b: Batch) => b.quantity > 0)
      .sort((a: Batch, b: Batch) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());

    const current_price = activeBatches.length > 0 ? activeBatches[0].sale_price : 0;
    const total_quantity = activeBatches.reduce((acc: number, b: Batch) => acc + b.quantity, 0);

    const result = {
      ...p,
      current_price,
      total_quantity,
      activeBatches,
      scanned_batch_id: batch.id,
    };

    // Save lookup result to cache
    saveProductsToCache(pharmacyId, [result]);

    return result;
  } catch (err) {
    console.warn('[Cache Fallback] Barcode lookup failed, using local copy:', err);
    return getLocalProductByBarcode(barcode, pharmacyId);
  }
}

/**
 * Syncs the entire pharmacy product catalog to IndexedDB for offline read operation.
 */
export async function syncProductCatalogToCache(pharmacyId: string): Promise<void> {
  // Hard cap: fetching unlimited rows can OOM large pharmacies after years of data.
  const PAGE_SIZE = 1000;
  let allProducts: any[] = [];
  let page = 0;

  try {
    while (true) {
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          *,
          batches (
            *
          ),
          pharmacy:pharmacies(name)
        `)
        .eq('pharmacy_id', pharmacyId)
        .eq('batches.pharmacy_id', pharmacyId)
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (error) throw error;
      if (!products || products.length === 0) break;

      allProducts = allProducts.concat(products);
      if (products.length < PAGE_SIZE) break; // last page
      page++;

      // Safety: stop at 5 pages (5000 products) to prevent runaway fetches
      if (page >= 5) {
        console.warn('[Cache Sync] Hit 5000-product safety cap. Stopping early.');
        break;
      }
    }

    if (allProducts.length > 0) {
      const mapped = allProducts.map((p: any) => {
        const activeBatches = (p.batches || [])
          .filter((b: Batch) => b.quantity > 0)
          .sort((a: Batch, b: Batch) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());

        const current_price = activeBatches.length > 0 ? activeBatches[0].sale_price : 0;
        const total_quantity = activeBatches.reduce((acc: number, b: Batch) => acc + b.quantity, 0);

        return {
          ...p,
          current_price,
          total_quantity,
          activeBatches,
          pharmacy_name: p.pharmacy?.name || 'مجهول'
        };
      });

      await saveProductsToCache(pharmacyId, mapped as any);
      console.log(`[Cache Sync] Cached ${mapped.length} catalog products locally.`);
    }
  } catch (err) {
    console.error('[Cache Sync] Sync failed:', err);
  }
}

export async function updateBatch(batchId: string, updates: Partial<Batch>) {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  
  if (!pharmacyId || pharmacyId === 'undefined') {
    throw new Error('فشل التحقق من هوية الصيدلية. الرجاء إعادة تسجيل الدخول.');
  }

  // Validations
  if (updates.quantity !== undefined && updates.quantity <= 0) throw new Error('Validation Error: Quantity must be > 0');
  if (updates.purchase_price !== undefined && updates.purchase_price <= 0) throw new Error('Validation Error: Purchase price must be > 0');
  if (updates.sale_price !== undefined && updates.sale_price <= 0) throw new Error('Validation Error: Selling price must be > 0');

  // Security Check
  const { data: existingBatch, error: findError } = await supabase
    .from('batches')
    .select('id, pharmacy_id')
    .eq('id', batchId)
    .maybeSingle();

  if (findError) throw findError;
  if (!existingBatch) throw new Error(`التشغيلة غير موجودة في قاعدة البيانات (ID: ${batchId})`);
  if (existingBatch.pharmacy_id !== pharmacyId) throw new Error('خطأ في الصلاحيات: التشغيلة تنتمي لصيدلية أخرى');

  const { data, error } = await supabase
    .from('batches')
    .update(updates)
    .eq('id', batchId)
    .eq('pharmacy_id', pharmacyId)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('لم يتم تحديث التشغيلة.');

  return data;
}

export async function createBatch(batch: Partial<Batch>) {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) throw new Error('Unauthorized');

  if (batch.quantity !== undefined && batch.quantity <= 0) throw new Error('Validation Error: Quantity must be > 0');
  if (batch.purchase_price !== undefined && batch.purchase_price <= 0) throw new Error('Validation Error: Purchase price must be > 0');
  if (batch.sale_price !== undefined && batch.sale_price <= 0) throw new Error('Validation Error: Selling price must be > 0');

  const payload = { ...batch, pharmacy_id: pharmacyId };

  const { data, error } = await supabase
    .from('batches')
    .insert([payload])
    .select()
    .maybeSingle(); // ✅ safe — avoids PGRST116 if RLS silently blocks the insert

  if (error) throw error;
  if (!data) throw new Error('فشل إنشاء التشغيلة — تحقق من صلاحيات قاعدة البيانات.');
  return data;
}

export async function deleteProduct(productId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) throw new Error('Unauthorized');

  const { count, error: countErr } = await supabase
    .from('order_items')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId)
    .eq('pharmacy_id', pharmacyId);

  if (countErr) throw countErr;
  if (count && count > 0) throw new Error('لا يمكن حذف المنتج لوجود عمليات بيع مسجلة له.');

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('pharmacy_id', pharmacyId);

  if (error) throw error;
}

export async function deleteBatch(batchId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) throw new Error('Unauthorized');

  const { count, error: countErr } = await supabase
    .from('order_items')
    .select('*', { count: 'exact', head: true })
    .eq('batch_id', batchId)
    .eq('pharmacy_id', pharmacyId);

  if (countErr) throw countErr;
  if (count && count > 0) throw new Error('لا يمكن حذف هذه التشغيلة لوجود عمليات بيع مسجلة منها.');

  const { error } = await supabase
    .from('batches')
    .delete()
    .eq('id', batchId)
    .eq('pharmacy_id', pharmacyId);

  if (error) throw error;
}
