export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  minStock: number;
  maxStock?: number;
  location?: string;
  category?: string;
  lastMovement: Date;
  status: 'ok' | 'low' | 'out' | 'overstock';
  value: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  reference?: string;
  userId: string;
  userName?: string;
  location?: string;
  createdAt: Date;
}

export interface InventoryAlert {
  id: string;
  productId: string;
  productName: string;
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
  message: string;
  currentStock: number;
  threshold: number;
  createdAt: Date;
  resolved: boolean;
}

export interface InventoryFilters {
  productId?: string;
  lowStock?: boolean;
  location?: string;
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface InventoryReport {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  topMovements: StockMovement[];
  alerts: InventoryAlert[];
}

export interface StockValuation {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
  location?: string;
}