import Dexie, { type Table } from 'dexie';

export interface DraftInventoryItem {
  id?: number;
  batchId: string;
  productId: string;
  barcode: string;
  name: string;
  expectedQuantity: number;
  actualQuantity?: number;
  status: 'pending' | 'confirmed';
}

export interface InventorySession {
  id?: number;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'completed';
  totalItems: number;
}

export class PharmaNileDB extends Dexie {
  draft_inventory!: Table<DraftInventoryItem, number>;
  inventory_sessions!: Table<InventorySession, number>;

  constructor() {
    super('PharmaNileDB');
    // @ts-ignore
    this.version(1).stores({
      draft_inventory: '++id, batchId, productId, barcode, status',
      inventory_sessions: '++id, status',
    });
  }
}

export const db = new PharmaNileDB();
