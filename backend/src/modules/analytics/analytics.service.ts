import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const totalProducts = await this.prisma.product.count();
    const totalCustomers = await this.prisma.customer.count();
    const totalSales = await this.prisma.sale.count();
    
    const totalRevenue = await this.prisma.sale.aggregate({
      _sum: { total: true },
    });

    // Products with low stock
    const products = await this.prisma.product.findMany({
      select: { stock: true, minStock: true },
    });
    const lowStockProducts = products.filter(p => p.stock <= p.minStock).length;

    return {
      totalProducts,
      totalCustomers,
      totalSales,
      totalRevenue: totalRevenue._sum.total || 0,
      lowStockProducts,
      lastUpdated: new Date(),
    };
  }
}
