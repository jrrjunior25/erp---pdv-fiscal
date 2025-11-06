import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as XLSX from 'xlsx';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);

    const [totalProducts, totalCustomers, totalSales, totalRevenue, salesToday, salesYesterday, products, topProducts, topCustomers, paymentMethods] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.customer.count(),
      this.prisma.sale.count(),
      this.prisma.sale.aggregate({ _sum: { total: true } }),
      this.prisma.sale.aggregate({ where: { createdAt: { gte: today } }, _sum: { total: true }, _count: true }),
      this.prisma.sale.aggregate({ where: { createdAt: { gte: yesterday, lt: today } }, _sum: { total: true }, _count: true }),
      this.prisma.product.findMany({ select: { stock: true, minStock: true } }),
      this.prisma.saleItem.groupBy({ by: ['productId'], _sum: { total: true }, orderBy: { _sum: { total: 'desc' } }, take: 5 }),
      this.prisma.sale.groupBy({ by: ['customerId'], where: { customerId: { not: null } }, _sum: { total: true }, orderBy: { _sum: { total: 'desc' } }, take: 5 }),
      this.prisma.sale.groupBy({ by: ['paymentMethod'], _sum: { total: true } })
    ]);

    const lowStockProducts = products.filter(p => p.stock <= p.minStock).length;
    const salesTrend = await this.getSalesTrend(last7Days);

    const topProductsData = await Promise.all(
      topProducts.map(async (item) => {
        const product = await this.prisma.product.findUnique({ where: { id: item.productId }, select: { name: true } });
        return { name: product?.name || 'N/A', value: item._sum.total || 0 };
      })
    );

    const topCustomersData = await Promise.all(
      topCustomers.map(async (item) => {
        const customer = await this.prisma.customer.findUnique({ where: { id: item.customerId }, select: { name: true } });
        return { name: customer?.name || 'N/A', value: item._sum.total || 0 };
      })
    );

    const paymentMethodsData = paymentMethods.map(pm => ({ method: pm.paymentMethod, value: pm._sum.total || 0 }));

    return {
      kpis: {
        totalSalesToday: { value: salesToday._sum.total || 0, trend: this.calculateTrend(salesToday._sum.total || 0, salesYesterday._sum.total || 0) },
        ticketMedio: { value: salesToday._count > 0 ? (salesToday._sum.total || 0) / salesToday._count : 0, trend: 0 },
        newCustomersToday: { value: 0, trend: 0 },
        itemsSoldToday: { value: salesToday._count, trend: 0 },
        totalPayablePending: 0,
        totalReceivablePending: 0
      },
      charts: {
        salesTrend,
        paymentMethods: paymentMethodsData
      },
      lists: {
        topProducts: topProductsData,
        topCustomers: topCustomersData
      },
      totalProducts,
      totalCustomers,
      totalSales,
      totalRevenue: totalRevenue._sum.total || 0,
      lowStockProducts
    };
  }

  private calculateTrend(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private async getSalesTrend(startDate: Date) {
    const sales = await this.prisma.sale.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, total: true }
    });

    const grouped = sales.reduce((acc, sale) => {
      const date = sale.createdAt.toISOString().split('T')[0];
      if (!acc[date]) acc[date] = 0;
      acc[date] += sale.total;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([date, value]) => ({ date, value }));
  }

  async getAnalytics(period: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const [sales, customers, products] = await Promise.all([
      this.prisma.sale.findMany({
        where: { createdAt: { gte: startDate } },
        include: { items: { include: { product: true } } }
      }),
      this.prisma.customer.findMany(),
      this.prisma.product.findMany()
    ]);

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    const topProducts = sales
      .flatMap(sale => sale.items)
      .reduce((acc, item) => {
        const key = item.product.name;
        if (!acc[key]) acc[key] = { name: key, quantity: 0, revenue: 0 };
        acc[key].quantity += item.quantity;
        acc[key].revenue += item.total;
        return acc;
      }, {} as Record<string, any>);

    return {
      salesMetrics: {
        totalSales,
        totalRevenue,
        averageTicket,
        topProducts: Object.values(topProducts).slice(0, 10)
      },
      customerMetrics: {
        totalCustomers: customers.length,
        newCustomers: customers.filter(c => c.createdAt >= startDate).length,
        loyaltyPoints: customers.reduce((sum, c) => sum + c.loyaltyPoints, 0)
      },
      inventoryMetrics: {
        lowStockItems: products.filter(p => p.stock <= p.minStock).length,
        totalProducts: products.length,
        stockValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0)
      }
    };
  }

  async exportToExcel(period: number = 30): Promise<Buffer> {
    const analytics = await this.getAnalytics(period);
    
    const data = [
      { Métrica: 'Total de Vendas', Valor: analytics.salesMetrics.totalSales },
      { Métrica: 'Receita Total', Valor: analytics.salesMetrics.totalRevenue },
      { Métrica: 'Ticket Médio', Valor: analytics.salesMetrics.averageTicket },
      { Métrica: 'Total de Clientes', Valor: analytics.customerMetrics.totalCustomers },
      { Métrica: 'Novos Clientes', Valor: analytics.customerMetrics.newCustomers },
      { Métrica: 'Total de Produtos', Valor: analytics.inventoryMetrics.totalProducts },
      { Métrica: 'Produtos com Estoque Baixo', Valor: analytics.inventoryMetrics.lowStockItems },
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Analytics');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
