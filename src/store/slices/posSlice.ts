import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { getMultiplier } from '@/lib/unitOptions';

export interface BatchDistribution {
  batchId: string;
  quantity: number;
  expiry: string;
  price: number;        // selling price from that batch
  purchasePrice: number; // cost price from that batch
}

export interface CartItem {
  id: string; // Product ID or Barcode
  name: string;
  price: number;           // Display price (first batch FEFO) — kept for backward compat & unit display
  basePrice: number;       // Original box-level price from first batch
  quantity: number;
  unit: string;
  availableUnits: string[];
  unitConversion: number;
  customPills?: number;
  activeBatches?: any[];                 // All active batches for this product
  batchDistributions?: BatchDistribution[]; // Auto or user-defined distribution
}

interface PosState {
  cart: CartItem[];
  total: number;
}

const initialState: PosState = {
  cart: [],
  total: 0,
};

/**
 * Auto-distribute a requested quantity across batches using FEFO
 * (First Expiry First Out). Each batch portion keeps its own price.
 */
function autoDistribute(
  activeBatches: any[] | undefined,
  requestedQty: number,
  unit: string,
  unitConversion: number,
  customPills?: number,
): BatchDistribution[] {
  if (!activeBatches || activeBatches.length === 0) return [];

  // Batches are already sorted FEFO from the API (earliest expiry first)
  const distributions: BatchDistribution[] = [];
  let remaining = requestedQty;

  for (const batch of activeBatches) {
    if (remaining <= 0) break;
    const available = Number(batch.quantity);
    if (available <= 0) continue;

    const take = Math.min(available, remaining);

    // Calculate per-unit price from this batch's selling_price
    const multi = getMultiplier(
      { unit_conversion: unitConversion, unit: 'علبة' },
      unit,
      customPills || 10,
    );
    const unitPrice = Number((Number(batch.selling_price) / multi).toFixed(2));
    const unitCost = Number((Number(batch.purchase_price) / multi).toFixed(2));

    distributions.push({
      batchId: batch.id,
      quantity: take,
      expiry: batch.expiry_date,
      price: unitPrice,
      purchasePrice: unitCost,
    });

    remaining -= take;
  }

  return distributions;
}

/** Calculate total from all cart items using their batch distributions */
function calcTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => {
    if (item.batchDistributions && item.batchDistributions.length > 0) {
      // Weighted total: Σ(batch_qty × batch_price)
      return sum + item.batchDistributions.reduce(
        (batchSum, d) => batchSum + d.quantity * d.price,
        0,
      );
    }
    // Fallback if no distributions
    return sum + item.price * item.quantity;
  }, 0);
}

const posSlice = createSlice({
  name: 'pos',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.cart.find((item) => item.id === action.payload.id);
      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
        // Re-distribute across batches with new total quantity
        existingItem.batchDistributions = autoDistribute(
          existingItem.activeBatches,
          existingItem.quantity,
          existingItem.unit,
          existingItem.unitConversion,
          existingItem.customPills,
        );
      } else {
        const newItem = { ...action.payload };
        // Auto-distribute for new items
        newItem.batchDistributions = autoDistribute(
          newItem.activeBatches,
          newItem.quantity,
          newItem.unit,
          newItem.unitConversion,
          newItem.customPills,
        );
        state.cart.push(newItem);
      }
      state.total = calcTotal(state.cart);
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.cart = state.cart.filter((item) => item.id !== action.payload);
      state.total = calcTotal(state.cart);
    },
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.cart.find((item) => item.id === action.payload.id);
      if (item) {
        item.quantity = action.payload.quantity;
        // Re-distribute across batches
        item.batchDistributions = autoDistribute(
          item.activeBatches,
          item.quantity,
          item.unit,
          item.unitConversion,
          item.customPills,
        );
      }
      state.total = calcTotal(state.cart);
    },
    updateUnit: (state, action: PayloadAction<{ id: string; unit: string; customPills?: number }>) => {
      const item = state.cart.find((item) => item.id === action.payload.id);
      if (item) {
        item.unit = action.payload.unit;
        if (action.payload.customPills) {
          item.customPills = action.payload.customPills;
        }
        // Update display price
        const multi = getMultiplier({ unit_conversion: item.unitConversion, unit: "علبة" }, item.unit, item.customPills || 10);
        item.price = Number((item.basePrice / multi).toFixed(2));
        // Re-distribute with new unit pricing
        item.batchDistributions = autoDistribute(
          item.activeBatches,
          item.quantity,
          item.unit,
          item.unitConversion,
          item.customPills,
        );
      }
      state.total = calcTotal(state.cart);
    },
    updateBatchDistribution: (state, action: PayloadAction<{ id: string; distributions: BatchDistribution[] }>) => {
      const item = state.cart.find((item) => item.id === action.payload.id);
      if (item) {
        item.batchDistributions = action.payload.distributions;
        // Update quantity to match total distribution
        const totalDist = action.payload.distributions.reduce((sum, d) => sum + d.quantity, 0);
        if (totalDist > 0) {
          item.quantity = totalDist;
        }
      }
      state.total = calcTotal(state.cart);
    },
    clearCart: (state) => {
      state.cart = [];
      state.total = 0;
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, updateUnit, updateBatchDistribution, clearCart } = posSlice.actions;
export default posSlice.reducer;
