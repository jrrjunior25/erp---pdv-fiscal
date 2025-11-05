export interface PurchaseOrder {
  id: string;
  number: string;
  supplierId: string;
  status: 'PENDING' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';
  total: number;
  items: PurchaseItem[];
  createdAt: Date;
  approvedAt?: Date;
}

export interface PurchaseItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseFilters {
  supplierId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}