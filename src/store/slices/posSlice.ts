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

function autoDistribute(
  activeBatches: any[] | undefined,
  requestedQty: number,
  unit: string,
  unitConversion: number,
  customPills?: number,
): BatchDistribution[] {
  if (!activeBatches || activeBatches.length === 0) {
    console.log('⚠️ autoDistribute: no active batches');
    return [];
  }

  console.log('🔍 autoDistribute - inputs:', {
    requestedQty,
    unit,
    unitConversion,
    customPills: customPills || 10,
  });

  const distributions: BatchDistribution[] = [];
  let remaining = requestedQty;

  for (const batch of activeBatches) {
    if (remaining <= 0) break;
    const available = Number(batch.quantity);
    if (available <= 0) continue;

    const take = Math.min(available, remaining);

    const multi = getMultiplier(
      { unit_conversion: unitConversion, unit: 'علبة' },
      unit,
      customPills || 10,
    );

    console.log(`🔍 autoDistribute - batch ${batch.id}: multi = ${multi}`);

    const unitPrice = Number((Number(batch.sale_price) / multi).toFixed(2));
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

  console.log('🔍 autoDistribute - resulting distributions:', distributions);
  return distributions;
}

function calcTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => {
    if (item.batchDistributions && item.batchDistributions.length > 0) {
      return sum + item.batchDistributions.reduce(
        (batchSum, d) => batchSum + d.quantity * d.price,
        0,
      );
    }
    return sum + item.price * item.quantity;
  }, 0);
}

const posSlice = createSlice({
  name: 'pos',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      console.log('🔍 addToCart - payload:', action.payload);
      const existingItem = state.cart.find((item) => item.id === action.payload.id);
      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
        existingItem.batchDistributions = autoDistribute(
          existingItem.activeBatches,
          existingItem.quantity,
          existingItem.unit,
          existingItem.unitConversion,
          existingItem.customPills,
        );
      } else {
        const newItem = { ...action.payload };
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
      console.log('🔍 addToCart - total:', state.total);
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.cart = state.cart.filter((item) => item.id !== action.payload);
      state.total = calcTotal(state.cart);
    },
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.cart.find((item) => item.id === action.payload.id);
      if (item) {
        item.quantity = action.payload.quantity;
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
        console.log('🔍 updateUnit - before update:', {
          id: item.id,
          name: item.name,
          unitConversion: item.unitConversion,
          basePrice: item.basePrice,
          currentUnit: item.unit,
          newUnit: action.payload.unit,
          customPills: action.payload.customPills || item.customPills || 10,
        });

        item.unit = action.payload.unit;
        if (action.payload.customPills) {
          item.customPills = action.payload.customPills;
        }

        const multi = getMultiplier(
          { unit_conversion: item.unitConversion, unit: 'علبة' },
          item.unit,
          item.customPills || 10,
        );

        console.log('🔍 updateUnit - multiplier:', multi);
        item.price = Number((item.basePrice / multi).toFixed(2));
        console.log('🔍 updateUnit - new price:', item.price);

        item.batchDistributions = autoDistribute(
          item.activeBatches,
          item.quantity,
          item.unit,
          item.unitConversion,
          item.customPills,
        );
      }
      state.total = calcTotal(state.cart);
      console.log('🔍 updateUnit - total:', state.total);
    },
    updateBatchDistribution: (state, action: PayloadAction<{ id: string; distributions: BatchDistribution[] }>) => {
      const item = state.cart.find((item) => item.id === action.payload.id);
      if (item) {
        item.batchDistributions = action.payload.distributions;
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

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  updateUnit,
  updateBatchDistribution,
  clearCart,
} = posSlice.actions;

export default posSlice.reducer;