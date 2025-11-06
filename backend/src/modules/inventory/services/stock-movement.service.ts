import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { StockMovement } from '../interfaces/inventory.interface';

@Injectable()
export class StockMovementService {
  constructor(private prisma: PrismaService) {}

  async createMovement(data: {
    productId: string;
    type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
    quantity: number;
    reason: string;
    reference?: string;
    userId: string;
    location?: string;
  }): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: data.productId }
    });

    if (!product) {
      throw new Error('Produto não encontrado');
    }

    const previousStock = product.stock;
    let newStock: number;

    switch (data.type) {
      case 'IN':
        newStock = previousStock + data.quantity;
        break;
      case 'OUT':
        newStock = Math.max(0, previousStock - data.quantity);
        break;
      case 'ADJUSTMENT':
        newStock = data.quantity;
        break;
      case 'TRANSFER':
        newStock = Math.max(0, previousStock - data.quantity);
        break;
    }

    await this.prisma.product.update({
      where: { id: data.productId },
      data: { stock: newStock }
    });
  }

  async getMovements(filters?: {
    productId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
  }): Promise<StockMovement[]> {
    const sales = await this.prisma.saleItem.findMany({
      where: {
        ...(filters?.productId && { productId: filters.productId }),
        ...(filters?.dateFrom && { createdAt: { gte: filters.dateFrom } }),
        ...(filters?.dateTo && { createdAt: { lte: filters.dateTo } })
      },
      include: {
        product: true,
        sale: { include: { seller: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100
    });

    const purchases = await this.prisma.purchaseItem.findMany({
      where: {
        ...(filters?.productId && { productId: filters.productId }),
        ...(filters?.dateFrom && { createdAt: { gte: filters.dateFrom } }),
        ...(filters?.dateTo && { createdAt: { lte: filters.dateTo } })
      },
      include: {
        product: true,
        purchase: { include: { supplier: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100
    });

    const movements: StockMovement[] = [
      ...sales.map(item => ({
        id: `sale-${item.id}`,
        productId: item.productId,
        productName: item.product.name,
        type: 'OUT' as const,
        quantity: item.quantity,
        previousStock: 0,
        newStock: 0,
        reason: `Venda #${item.sale.number}`,
        reference: item.sale.id,
        userId: item.sale.sellerId || '',
        userName: item.sale.seller?.name,
        createdAt: item.createdAt
      })),
      ...purchases.map(item => ({
        id: `purchase-${item.id}`,
        productId: item.productId,
        productName: item.product.name,
        type: 'IN' as const,
        quantity: item.quantity,
        previousStock: 0,
        newStock: 0,
        reason: `Compra #${item.purchase.number}`,
        reference: item.purchase.id,
        userId: '',
        userName: item.purchase.supplier.name,
        createdAt: item.createdAt
      }))
    ];

    return movements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}