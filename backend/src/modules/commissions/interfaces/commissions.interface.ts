export interface Commission {
  id: string;
  saleId: string;
  sellerId: string;
  amount: number;
  rate: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  paidAt?: Date;
  createdAt: Date;
}

export interface CommissionFilters {
  sellerId?: string;
  status?: 'PENDING' | 'PAID' | 'CANCELLED';
  startDate?: Date;
  endDate?: Date;
}

export interface CommissionSummary {
  totalCommissions: number;
  totalPaid: number;
  totalPending: number;
  commissionsCount: number;
}