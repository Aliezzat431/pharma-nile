const DB_NAME = 'PharmaNileCache_Orders';
const DB_VERSION = 2;
const STORE_NAME = 'offline_orders';
const RETURNS_STORE_NAME = 'offline_returns';
const CACHED_ORDERS_STORE_NAME = 'cached_orders';

export interface QueuedOrder {
  id: string; 
  cart: any[];
  total: number;
  paymentMethod: 'cash' | 'debt' | 'sadqah';
  customerId?: string;
  createdAt: string;
}

export interface QueuedReturn {
  id: string; 
  createdAt: string;
}

function openOrdersDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(RETURNS_STORE_NAME)) {
        db.createObjectStore(RETURNS_STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(CACHED_ORDERS_STORE_NAME)) {
        db.createObjectStore(CACHED_ORDERS_STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}


export async function saveOrdersToCache(orders: any[]): Promise<void> {
  try {
    const db = await openOrdersDB();
    const transaction = db.transaction(CACHED_ORDERS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(CACHED_ORDERS_STORE_NAME);

    
    store.clear();

    for (const order of orders) {
      store.put(order);
    }
  } catch (err) {
    console.error('[Offline Orders Cache] Failed to write cache:', err);
  }
}


export async function getCachedOrdersList(): Promise<any[]> {
  try {
    const db = await openOrdersDB();
    const transaction = db.transaction(CACHED_ORDERS_STORE_NAME, 'readonly');
    const store = transaction.objectStore(CACHED_ORDERS_STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        
        const sorted = (request.result || []).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        resolve(sorted);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('[Offline Orders Cache] Failed to load cache:', err);
    return [];
  }
}


export async function queueOfflineOrder(order: Omit<QueuedOrder, 'id' | 'createdAt'>): Promise<string> {
  const tempId = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const payload: QueuedOrder = {
    ...order,
    id: tempId,
    createdAt: new Date().toISOString()
  };

  try {
    const db = await openOrdersDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(payload);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(tempId);
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.error('[Offline Sync] Failed to queue order:', err);
    
    if (typeof window !== 'undefined') {
      const fallbackList = JSON.parse(localStorage.getItem(STORE_NAME) || '[]');
      fallbackList.push(payload);
      localStorage.setItem(STORE_NAME, JSON.stringify(fallbackList));
      return tempId;
    }
    throw err;
  }
}


export async function getQueuedOrders(): Promise<QueuedOrder[]> {
  try {
    const db = await openOrdersDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('[Offline Sync] Failed to read queue:', err);
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem(STORE_NAME) || '[]');
    }
    return [];
  }
}


export async function dequeueOrder(id: string): Promise<void> {
  try {
    const db = await openOrdersDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(id);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.error('[Offline Sync] Failed to dequeue order:', err);
    if (typeof window !== 'undefined') {
      const fallbackList = JSON.parse(localStorage.getItem(STORE_NAME) || '[]');
      const filtered = fallbackList.filter((item: any) => item.id !== id);
      localStorage.setItem(STORE_NAME, JSON.stringify(filtered));
    }
  }
}


export async function queueOfflineReturn(orderId: string): Promise<void> {
  const payload: QueuedReturn = {
    id: orderId,
    createdAt: new Date().toISOString()
  };

  try {
    const db = await openOrdersDB();
    const transaction = db.transaction(RETURNS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(RETURNS_STORE_NAME);
    store.put(payload);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.error('[Offline Sync] Failed to queue return:', err);
    if (typeof window !== 'undefined') {
      const fallbackList = JSON.parse(localStorage.getItem(RETURNS_STORE_NAME) || '[]');
      fallbackList.push(payload);
      localStorage.setItem(RETURNS_STORE_NAME, JSON.stringify(fallbackList));
    }
  }
}


export async function getQueuedReturns(): Promise<QueuedReturn[]> {
  try {
    const db = await openOrdersDB();
    const transaction = db.transaction(RETURNS_STORE_NAME, 'readonly');
    const store = transaction.objectStore(RETURNS_STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('[Offline Sync] Failed to read queued returns:', err);
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem(RETURNS_STORE_NAME) || '[]');
    }
    return [];
  }
}


export async function dequeueReturn(orderId: string): Promise<void> {
  try {
    const db = await openOrdersDB();
    const transaction = db.transaction(RETURNS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(RETURNS_STORE_NAME);
    store.delete(orderId);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.error('[Offline Sync] Failed to dequeue return:', err);
    if (typeof window !== 'undefined') {
      const fallbackList = JSON.parse(localStorage.getItem(RETURNS_STORE_NAME) || '[]');
      const filtered = fallbackList.filter((item: any) => item.id !== orderId);
      localStorage.setItem(RETURNS_STORE_NAME, JSON.stringify(filtered));
    }
  }
}


export async function syncOfflineReturns(
  processReturnFn: (orderId: string) => Promise<any>
): Promise<number> {
  const queued = await getQueuedReturns();
  if (queued.length === 0) return 0;

  let successCount = 0;

  for (const ret of queued) {
    try {
      await processReturnFn(ret.id);
      await dequeueReturn(ret.id);
      successCount++;
    } catch (err) {
      console.error(`[Offline Sync] Failed to replay return for order ${ret.id}:`, err);
      break;
    }
  }

  return successCount;
}


export async function syncOfflineTransactions(
  processCheckoutFn: (cart: any[], total: number, paymentMethod: any, customerId?: string) => Promise<any>
): Promise<number> {
  const queued = await getQueuedOrders();
  if (queued.length === 0) return 0;

  let successCount = 0;

  for (const order of queued) {
    try {
      
      const cartItems = order.cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        unit: item.unit,
        costPrice: item.activeBatches?.[0]?.purchase_price || 0,
        batchDistributions: item.batchDistributions || []
      }));

      
      await processCheckoutFn(cartItems, order.total, order.paymentMethod, order.customerId);
      
      
      await dequeueOrder(order.id);
      successCount++;
    } catch (err) {
      console.error(`[Offline Sync] Failed to sync transaction ${order.id}:`, err);
      
      break;
    }
  }

  return successCount;
}
