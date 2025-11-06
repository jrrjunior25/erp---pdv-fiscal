export class StockMovement {
  id: string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  reference?: string;
  userId: string;
  location?: string;
  createdAt: Date;
}

export class InventoryAlert {
  id: string;
  productId: string;
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
  message: string;
  currentStock: number;
  threshold: number;
  createdAt: Date;
  resolved: boolean;
}