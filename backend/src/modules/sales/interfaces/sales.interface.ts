export interface SaleItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

export interface Sale {
  id: string;
  number: number;
  customerId?: string;
  shiftId: string;
  sellerId?: string;
  total: number;
  discount: number;
  paymentMethod: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  items: SaleItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleFilters {
  startDate?: Date;
  endDate?: Date;
  customerId?: string;
  sellerId?: string;
  paymentMethod?: string;
  status?: string;
}

export interface SaleStats {
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  paymentMethodStats: Array<{
    method: string;
    count: number;
    total: number;
  }>;
}