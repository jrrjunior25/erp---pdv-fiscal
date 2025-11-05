export interface InventoryItem {
  id: string;
  productId: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  location?: string;
  lastMovement: Date;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: string;
  userId: string;
  createdAt: Date;
}

export interface InventoryFilters {
  productId?: string;
  lowStock?: boolean;
  location?: string;
}