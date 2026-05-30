import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { getMultiplier } from '@/lib/unitOptions';

export interface CartItem {
  id: string; // Product ID or Barcode
  name: string;
  price: number;
  basePrice: number;
  quantity: number;
  unit: string;
  availableUnits: string[];
  unitConversion: number;
  customPills?: number;
}

interface PosState {
  cart: CartItem[];
  total: number;
}

const initialState: PosState = {
  cart: [],
  total: 0,
};

const posSlice = createSlice({
  name: 'pos',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.cart.find((item) => item.id === action.payload.id);
      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.cart.push(action.payload);
      }
      state.total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.cart = state.cart.filter((item) => item.id !== action.payload);
      state.total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.cart.find((item) => item.id === action.payload.id);
      if (item) {
        item.quantity = action.payload.quantity;
      }
      state.total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },
    updateUnit: (state, action: PayloadAction<{ id: string; unit: string; customPills?: number }>) => {
      const item = state.cart.find((item) => item.id === action.payload.id);
      if (item) {
        item.unit = action.payload.unit;
        if (action.payload.customPills) {
          item.customPills = action.payload.customPills;
        }
        // Pseudo product mapping for the multiplier
        const multi = getMultiplier({ unit_conversion: item.unitConversion, unit: "علبة" }, item.unit, item.customPills || 10);
        item.price = Number((item.basePrice / multi).toFixed(2));
      }
      state.total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },
    clearCart: (state) => {
      state.cart = [];
      state.total = 0;
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, updateUnit, clearCart } = posSlice.actions;
export default posSlice.reducer;
