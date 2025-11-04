import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { CashShift } from '@types';
import apiClient from '@services/apiClient';

interface ShiftContextType {
  currentShift: CashShift | null;
  isShiftOpen: boolean;
  openShift: (openingBalance: number, userId: string, userName: string) => Promise<void>;
  closeShift: (closingBalance: number) => Promise<void>;
  recordMovement: (type: 'Suprimento' | 'Sangria', amount: number, reason: string, userId: string) => Promise<void>;
  refreshShift: () => Promise<void>;
  setCurrentShift: (shift: CashShift | null) => void;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export const useShift = () => {
  const context = useContext(ShiftContext);
  if (!context) {
    throw new Error('useShift must be used within ShiftProvider');
  }
  return context;
};

interface ShiftProviderProps {
  children: ReactNode;
}

export const ShiftProvider: React.FC<ShiftProviderProps> = ({ children }) => {
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);

  const isShiftOpen = currentShift?.status === 'OPEN';

  const refreshShift = useCallback(async () => {
    try {
      const shift = await apiClient.get<CashShift | null>('/shifts/current');
      setCurrentShift(shift);
    } catch (error) {
      console.error('Failed to refresh shift:', error);
      setCurrentShift(null); // Se der erro, assume que não há shift aberto
    }
  }, []);

  const openShift = useCallback(async (openingBalance: number, userId: string, userName: string) => {
    try {
      const newShift = await apiClient.post<CashShift>('/shifts/open', {
        openingBalance,
        userId,
        userName,
      });
      setCurrentShift(newShift);
    } catch (error) {
      console.error('Failed to open shift:', error);
      throw error;
    }
  }, []);

  const closeShift = useCallback(async (closingBalance: number) => {
    if (!currentShift) return;
    try {
      await apiClient.post('/shifts/close', { closingBalance });
      setCurrentShift(null);
    } catch (error) {
      console.error('Failed to close shift:', error);
      throw error;
    }
  }, [currentShift]);

  const recordMovement = useCallback(async (
    type: 'Suprimento' | 'Sangria',
    amount: number,
    reason: string,
    userId: string
  ) => {
    if (!currentShift) return;
    try {
      const updatedShift = await apiClient.post<CashShift>('/shifts/movement', {
        type,
        amount,
        reason,
        userId,
      });
      setCurrentShift(updatedShift);
    } catch (error) {
      console.error('Failed to record movement:', error);
      throw error;
    }
  }, [currentShift]);

  const value: ShiftContextType = {
    currentShift,
    isShiftOpen,
    openShift,
    closeShift,
    recordMovement,
    refreshShift,
    setCurrentShift,
  };

  return <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>;
};
