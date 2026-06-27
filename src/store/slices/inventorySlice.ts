import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface InventoryState {
  searchQuery: string;
  filterLowStock: boolean;
  filterExpiring: boolean;
}

const initialState: InventoryState = {
  searchQuery: '',
  filterLowStock: false,
  filterExpiring: false,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    toggleLowStockFilter: (state) => {
      state.filterLowStock = !state.filterLowStock;
    },
    toggleExpiringFilter: (state) => {
      state.filterExpiring = !state.filterExpiring;
    },
  },
});

export const { setSearchQuery, toggleLowStockFilter, toggleExpiringFilter } = inventorySlice.actions;
export default inventorySlice.reducer;

