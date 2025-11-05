export interface Return {
  id: string;
  saleId: string;
  reason: 'DEFECTIVE' | 'WRONG_ITEM' | 'CUSTOMER_CHANGE' | 'DAMAGED' | 'OTHER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  total: number;
  items: ReturnItem[];
  createdAt: Date;
  processedAt?: Date;
}

export interface ReturnItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ReturnFilters {
  saleId?: string;
  reason?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}