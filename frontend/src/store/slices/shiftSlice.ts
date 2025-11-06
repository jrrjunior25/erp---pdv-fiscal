import { StateCreator } from 'zustand';

interface CashShift {
  id: string;
  status: 'OPEN' | 'CLOSED';
  openingBalance: number;
  currentBalance: number;
  userId: string;
  userName: string;
}

export interface ShiftState {
  currentShift: CashShift | null;
  isShiftOpen: boolean;
  openShift: (openingBalance: number, userId: string, userName: string) => void;
  closeShift: (closingBalance: number) => void;
  setCurrentShift: (shift: CashShift | null) => void;
}

export const createShiftSlice: StateCreator<ShiftState> = (set, get) => ({
  currentShift: null,
  isShiftOpen: false,
  openShift: (openingBalance, userId, userName) => {
    const shift: CashShift = {
      id: Date.now().toString(),
      status: 'OPEN',
      openingBalance,
      currentBalance: openingBalance,
      userId,
      userName,
    };
    set({ currentShift: shift, isShiftOpen: true });
  },
  closeShift: (closingBalance) => {
    const { currentShift } = get();
    if (currentShift) {
      set({ 
        currentShift: { ...currentShift, status: 'CLOSED' }, 
        isShiftOpen: false 
      });
    }
  },
  setCurrentShift: (shift) => set({ 
    currentShift: shift, 
    isShiftOpen: shift?.status === 'OPEN' 
  }),
});