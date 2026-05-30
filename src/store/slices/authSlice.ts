import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'staff';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  sessionId: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  sessionId: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ user: User; sessionId: string }>) => {
      state.user = action.payload.user;
      state.sessionId = action.payload.sessionId;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.sessionId = null;
      state.isAuthenticated = false;
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
