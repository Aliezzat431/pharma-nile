import { configureStore } from '@reduxjs/toolkit';
import posReducer from './slices/posSlice';
import inventoryReducer from './slices/inventorySlice';
import authReducer from './slices/authSlice';
import agentReducer from './slices/agentSlice';

export const store = configureStore({
  reducer: {
    pos: posReducer,
    inventory: inventoryReducer,
    auth: authReducer,
    agent: agentReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
