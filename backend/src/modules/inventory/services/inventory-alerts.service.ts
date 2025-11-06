import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { InventoryAlert } from '../interfaces/inventory.interface';

@Injectable()
export class InventoryAlertsService {
  constructor(private prisma: PrismaService) {}

  async checkAlerts(): Promise<InventoryAlert[]> {
    const products = await this.prisma.product.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        stock: true,
        minStock: true
      }
    });

    const alerts: InventoryAlert[] = [];

    products.forEach(product => {
      if (product.stock === 0) {
        alerts.push({
          id: `out-${product.id}`,
          productId: product.id,
          productName: product.name,
          type: 'OUT_OF_STOCK',
          message: `Produto ${product.name} está em falta`,
          currentStock: product.stock,
          threshold: product.minStock,
          createdAt: new Date(),
          resolved: false
        });
      } else if (product.stock <= product.minStock && product.minStock > 0) {
        alerts.push({
          id: `low-${product.id}`,
          productId: product.id,
          productName: product.name,
          type: 'LOW_STOCK',
          message: `Produto ${product.name} com estoque baixo`,
          currentStock: product.stock,
          threshold: product.minStock,
          createdAt: new Date(),
          resolved: false
        });
      }
    });

    return alerts;
  }

  async getLowStockProducts(): Promise<any[]> {
    const products = await this.prisma.product.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        code: true,
        stock: true,
        minStock: true,
        category: true
      },
      orderBy: { stock: 'asc' }
    });

    return products.filter(p => 
      p.stock === 0 || (p.stock <= p.minStock && p.minStock > 0)
    );
  }
}