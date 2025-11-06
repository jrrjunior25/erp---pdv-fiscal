import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AuthState, createAuthSlice } from './slices/authSlice';
import { DataState, createDataSlice } from './slices/dataSlice';
import { CartState, createCartSlice } from './slices/cartSlice';
import { ShiftState, createShiftSlice } from './slices/shiftSlice';

export interface AppState extends AuthState, DataState, CartState, ShiftState {}

export const useAppStore = create<AppState>()(
  devtools(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createDataSlice(...a),
      ...createCartSlice(...a),
      ...createShiftSlice(...a),
    }),
    { name: 'erp-store' }
  )
);