

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


export async function saveProductsToCache(pharmacyId: string, products: CachedProduct[]): Promise<void> {
  
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

    
    for (const product of products) {
      
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


export async function getCachedProducts(pharmacyId: string): Promise<CachedProduct[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        
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


export async function searchLocalCache(query: string, pharmacyId: string): Promise<CachedProduct[]> {
  const cached = await getCachedProducts(pharmacyId);
  if (!query.trim()) return [];

  const normalizedQuery = query.toLowerCase().trim();
  const searchWords = normalizedQuery.split(/\s+/).filter(w => w.length >= 1);

  return cached.filter(p => {
    
    if (p.barcode && p.barcode.toLowerCase() === normalizedQuery) return true;
    if (p.activeBatches?.some(b => b.barcode && b.barcode.toLowerCase() === normalizedQuery)) return true;

    
    const nameMatch = searchWords.every(word => p.name.toLowerCase().includes(word));
    const companyMatch = p.company_name && searchWords.every(word => p.company_name!.toLowerCase().includes(word));

    return nameMatch || companyMatch;
  }).slice(0, 20); 
}


export async function getLocalProductByBarcode(barcode: string, pharmacyId: string): Promise<CachedProduct | null> {
  const cached = await getCachedProducts(pharmacyId);
  const normalizedBarcode = barcode.trim().toLowerCase();

  const product = cached.find(p => {
    if (p.barcode && p.barcode.toLowerCase() === normalizedBarcode) return true;
    return p.activeBatches?.some(b => b.barcode && b.barcode.toLowerCase() === normalizedBarcode);
  });

  return product || null;
}
