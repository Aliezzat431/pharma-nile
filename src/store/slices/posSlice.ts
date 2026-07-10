
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getMultiplier } from '@/lib/unitOptions';

export interface BatchDistribution {
  batchId: string;
  quantity: number;
  expiry: string;
  price: number;        
  purchasePrice: number; 
}

export interface CartItem {
  id: string; 
  name: string;
  price: number;           
  basePrice: number;       
  quantity: number;
  unit: string;
  availableUnits: string[];
  unitConversion: number;
  customPills?: number;
  activeBatches?: any[];                 
  batchDistributions?: BatchDistribution[]; 
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
  if (!activeBatches || activeBatches.length === 0) return [];

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
        item.unit = action.payload.unit;
        if (action.payload.customPills) {
          item.customPills = action.payload.customPills;
        }

        
        const multi = getMultiplier(
          { unit_conversion: item.unitConversion, unit: 'علبة' },
          item.unit,
          item.customPills || 10,
        );
        item.price = Number((item.basePrice / multi).toFixed(2));

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