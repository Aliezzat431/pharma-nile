import { 
  QueuedOrder, 
  syncOfflineTransactions,
  syncOfflineReturns
} from './offline-orders';

// Mock IndexedDB API that offline-orders.ts uses
const mockStore: Record<string, any[]> = {
  offline_orders: [],
  offline_returns: [],
  cached_orders: []
};

// We mock the DB functions in offline-orders.ts to use our simple mock database
jest.mock('./offline-orders', () => {
  const actual = jest.requireActual('./offline-orders');
  return {
    ...actual,
    getQueuedOrders: jest.fn().mockImplementation(() => Promise.resolve(mockStore.offline_orders)),
    getQueuedReturns: jest.fn().mockImplementation(() => Promise.resolve(mockStore.offline_returns)),
    dequeueOrder: jest.fn().mockImplementation((id) => {
      mockStore.offline_orders = mockStore.offline_orders.filter(o => o.id !== id);
      return Promise.resolve();
    }),
    dequeueReturn: jest.fn().mockImplementation((id) => {
      mockStore.offline_returns = mockStore.offline_returns.filter(r => r.id !== id);
      return Promise.resolve();
    }),
  };
});

describe('PharmaNile Offline Queue Conflict & Synchronization Tests', () => {
  beforeEach(() => {
    mockStore.offline_orders = [];
    mockStore.offline_returns = [];
    mockStore.cached_orders = [];
    jest.clearAllMocks();
  });

  test('syncOfflineTransactions processes all queued orders sequentially on success', async () => {
    const mockOrder1: QueuedOrder = {
      id: 'offline-001',
      createdAt: new Date().toISOString(),
      cart: [{ id: 'prod-1', name: 'Panadol', price: 15, quantity: 2 }],
      total: 30,
      paymentMethod: 'cash'
    };
    const mockOrder2: QueuedOrder = {
      id: 'offline-002',
      createdAt: new Date().toISOString(),
      cart: [{ id: 'prod-2', name: 'Aspirin', price: 10, quantity: 1 }],
      total: 10,
      paymentMethod: 'debt',
      customerId: 'cust-123'
    };

    mockStore.offline_orders = [mockOrder1, mockOrder2];

    const mockProcessCheckout = jest.fn().mockResolvedValue({ success: true, order_id: 'db-id-xyz' });

    const totalSynced = await syncOfflineTransactions(mockProcessCheckout);

    // Both transactions synced successfully
    expect(totalSynced).toBe(2);
    expect(mockProcessCheckout).toHaveBeenCalledTimes(2);
    
    // Check parameters passed to processCheckout
    expect(mockProcessCheckout).toHaveBeenNthCalledWith(1, 
      [{ id: 'prod-1', name: 'Panadol', price: 15, quantity: 2, unit: undefined, costPrice: 0, batchDistributions: [] }],
      30,
      'cash',
      undefined
    );

    expect(mockProcessCheckout).toHaveBeenNthCalledWith(2, 
      [{ id: 'prod-2', name: 'Aspirin', price: 10, quantity: 1, unit: undefined, costPrice: 0, batchDistributions: [] }],
      10,
      'debt',
      'cust-123'
    );
  });

  test('syncOfflineTransactions halts sequence on error to prevent cascading conflict', async () => {
    const mockOrder1: QueuedOrder = {
      id: 'offline-success',
      createdAt: new Date().toISOString(),
      cart: [{ id: 'prod-1', name: 'Panadol', price: 15, quantity: 1 }],
      total: 15,
      paymentMethod: 'cash'
    };
    
    const mockOrder2: QueuedOrder = {
      id: 'offline-conflict', // This one will clash (e.g. stock no longer available, price mismatch)
      createdAt: new Date().toISOString(),
      cart: [{ id: 'prod-2', name: 'Bipolan', price: 40, quantity: 5 }],
      total: 200,
      paymentMethod: 'cash'
    };

    const mockOrder3: QueuedOrder = {
      id: 'offline-deferred',
      createdAt: new Date().toISOString(),
      cart: [{ id: 'prod-1', name: 'Panadol', price: 15, quantity: 1 }],
      total: 15,
      paymentMethod: 'cash'
    };

    mockStore.offline_orders = [mockOrder1, mockOrder2, mockOrder3];

    // Mock processCheckout: first succeeds, second fails with constraint conflict
    const mockProcessCheckout = jest.fn()
      .mockResolvedValueOnce({ success: true })
      .mockRejectedValueOnce(new Error('CRITICAL DB ERROR: CHECK constraint violation (insufficient stock)'));

    const totalSynced = await syncOfflineTransactions(mockProcessCheckout);

    // Only 1 transaction succeeded, and sync loop stopped immediately
    expect(totalSynced).toBe(1);
    expect(mockProcessCheckout).toHaveBeenCalledTimes(2); // Attempted first and second
    
    // Remaining orders in the queue are preserved (not dequeued) so client can troubleshoot
    const remainingQueue = mockStore.offline_orders;
    expect(remainingQueue.length).toBe(2);
    expect(remainingQueue[0].id).toBe('offline-conflict');
    expect(remainingQueue[1].id).toBe('offline-deferred');
  });

  test('syncOfflineReturns handles sequence refund updates successfully', async () => {
    mockStore.offline_returns = [
      { id: 'order-101', createdAt: new Date().toISOString() },
      { id: 'order-102', createdAt: new Date().toISOString() }
    ];

    const mockProcessReturn = jest.fn().mockResolvedValue({ success: true });

    const totalRefunds = await syncOfflineReturns(mockProcessReturn);

    expect(totalRefunds).toBe(2);
    expect(mockProcessReturn).toHaveBeenCalledTimes(2);
    expect(mockStore.offline_returns.length).toBe(0);
  });
});
