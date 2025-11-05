export interface Shift {
  id: string;
  number: number;
  userId: string;
  status: 'OPEN' | 'CLOSED';
  openedAt: Date;
  closedAt?: Date;
  initialAmount: number;
  finalAmount?: number;
  totalSales?: number;
  totalCash?: number;
}

export interface ShiftFilters {
  userId?: string;
  status?: 'OPEN' | 'CLOSED';
  startDate?: Date;
  endDate?: Date;
}

export interface ShiftSummary {
  totalSales: number;
  totalCash: number;
  salesCount: number;
  averageTicket: number;
}