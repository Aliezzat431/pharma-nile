// ✅ Product Cache helper for Offline Read-Only POS Terminal operations using IndexedDB

const DB_NAME = 'PharmaNileCache';
const DB_VERSION = 1;
const STORE_NAME = 'catalog';

export interface CachedProduct {
  id: string;
  pharmacy_id: string;
  name: string;
  barcode: string;
  type: string;
  unit_conversion: number;
  company_name: string;
  price: number;
  current_price: number;
  total_quantity: number;
  activeBatches: any[];
  pharmacy_name: string;
}

// In-memory fallback if IndexedDB is fully disabled in the browser environment (e.g. Private Browsing)
let memoryCacheFallback: CachedProduct[] = [];

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Saves all products of the pharmacy to IndexedDB (with Ram fallback)
 */
export async function saveProductsToCache(pharmacyId: string, products: CachedProduct[]): Promise<void> {
  // Update in-memory backup anyway
  for (const product of products) {
    const idx = memoryCacheFallback.findIndex(p => p.id === product.id);
    const item = { ...product, pharmacy_id: pharmacyId };
    if (idx > -1) {
      memoryCacheFallback[idx] = item;
    } else {
      memoryCacheFallback.push(item);
    }
  }

  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Save each item
    for (const product of products) {
      // Keep pharmacy context
      store.put({ ...product, pharmacy_id: pharmacyId });
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.error('[Cache] Failed to save products to IndexedDB:', err);
  }
}

/**
 * Loads all cached products for the active pharmacy
 */
export async function getCachedProducts(pharmacyId: string): Promise<CachedProduct[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        // Filter by pharmacy_id to respect multi-tenancy
        const filtered = (request.result || []).filter((item: any) => item.pharmacy_id === pharmacyId);
        resolve(filtered);
      };
      request.onerror = () => {
        console.warn('[Cache] Request error, falling back to memory cache.');
        resolve(memoryCacheFallback.filter((item) => item.pharmacy_id === pharmacyId));
      };
    });
  } catch (err) {
    console.error('[Cache] Failed to fetch products from IndexedDB, using memory fallback:', err);
    return memoryCacheFallback.filter((item) => item.pharmacy_id === pharmacyId);
  }
}

/**
 * Queries the cached products using fuzzy string match or barcode search
 */
export async function searchLocalCache(query: string, pharmacyId: string): Promise<CachedProduct[]> {
  const cached = await getCachedProducts(pharmacyId);
  if (!query.trim()) return [];

  const normalizedQuery = query.toLowerCase().trim();
  const searchWords = normalizedQuery.split(/\s+/).filter(w => w.length >= 1);

  return cached.filter(p => {
    // 1. Barcode match
    if (p.barcode && p.barcode.toLowerCase() === normalizedQuery) return true;
    if (p.activeBatches?.some(b => b.barcode && b.barcode.toLowerCase() === normalizedQuery)) return true;

    // 2. Fuzzy words match
    const nameMatch = searchWords.every(word => p.name.toLowerCase().includes(word));
    const companyMatch = p.company_name && searchWords.every(word => p.company_name!.toLowerCase().includes(word));

    return nameMatch || companyMatch;
  }).slice(0, 20); // Limit to top 20 matches like the database
}

/**
 * Look up a product in local cache directly by a single barcode
 */
export async function getLocalProductByBarcode(barcode: string, pharmacyId: string): Promise<CachedProduct | null> {
  const cached = await getCachedProducts(pharmacyId);
  const normalizedBarcode = barcode.trim().toLowerCase();

  const product = cached.find(p => {
    if (p.barcode && p.barcode.toLowerCase() === normalizedBarcode) return true;
    return p.activeBatches?.some(b => b.barcode && b.barcode.toLowerCase() === normalizedBarcode);
  });

  return product || null;
}
