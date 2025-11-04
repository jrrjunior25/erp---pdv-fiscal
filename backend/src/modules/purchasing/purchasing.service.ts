import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PurchasingService {
  constructor(private prisma: PrismaService) {}

  async getOrders() {
    return this.prisma.purchase.findMany({
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOrder(data: any) {
    // Get next purchase number
    const lastPurchase = await this.prisma.purchase.findFirst({
      orderBy: { number: 'desc' },
    });
    const nextNumber = (lastPurchase?.number || 0) + 1;

    return this.prisma.purchase.create({
      data: {
        number: nextNumber,
        supplierId: data.supplierId,
        total: data.total,
        status: data.status || 'Pendente',
        items: {
          create: data.items || [],
        },
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async updateOrderStatus(orderId: string, status: string) {
    return this.prisma.purchase.update({
      where: { id: orderId },
      data: { status },
    });
  }
}
