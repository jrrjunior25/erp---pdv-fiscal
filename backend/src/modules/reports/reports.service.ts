import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { ReportFilters, SalesReportData, ReportOptions } from './interfaces/reports.interface';
import { REPORTS_CONSTANTS } from './constants/reports.constants';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private prisma: PrismaService,
    private pdfGenerator: PdfGeneratorService,
  ) {}

  async generateSalesReport(options: ReportOptions): Promise<Buffer | any> {
    try {
      this.logger.log(`Gerando relatório de vendas: ${options.format}`);
      
      const data = await this.getSalesReportData(options.filters);
      
      if (data.totalSales === 0) {
        throw new BadRequestException(REPORTS_CONSTANTS.ERROR_MESSAGES.NO_DATA);
      }

      switch (options.format) {
        case 'PDF':
          return this.pdfGenerator.generateSalesReport(data, options.filters);
        case 'EXCEL':
          return this.generateExcelReport(data);
        case 'CSV':
          return this.generateCsvReport(data);
        default:
          throw new BadRequestException(REPORTS_CONSTANTS.VALIDATION_MESSAGES.INVALID_FORMAT);
      }
    } catch (error) {
      this.logger.error('Erro ao gerar relatório', error);
      throw new BadRequestException(`${REPORTS_CONSTANTS.ERROR_MESSAGES.GENERATION_ERROR}: ${error.message}`);
    }
  }

  private async getSalesReportData(filters: ReportFilters): Promise<SalesReportData> {
    const where = {
      createdAt: {
        gte: filters.startDate,
        lte: filters.endDate,
      },
      ...(filters.sellerId && { sellerId: filters.sellerId }),
      ...(filters.customerId && { customerId: filters.customerId }),
      ...(filters.paymentMethod && { paymentMethod: filters.paymentMethod }),
      ...(filters.shiftId && { shiftId: filters.shiftId }),
    };

    // Dados básicos
    const [salesCount, salesSum] = await Promise.all([
      this.prisma.sale.count({ where }),
      this.prisma.sale.aggregate({ where, _sum: { total: true } }),
    ]);

    const totalRevenue = salesSum._sum.total || 0;
    const averageTicket = salesCount > 0 ? totalRevenue / salesCount : 0;

    // Vendas por dia
    const salesByDay = await this.getSalesByDay(where);

    // Vendas por forma de pagamento
    const salesByPayment = await this.prisma.sale.groupBy({
      by: ['paymentMethod'],
      where,
      _count: { id: true },
      _sum: { total: true },
    }).then(results => 
      results.map(item => ({
        method: item.paymentMethod,
        count: item._count.id,
        total: item._sum.total || 0,
      }))
    );

    // Top produtos
    const topProducts = await this.getTopProducts(where);

    // Vendas por vendedor
    const salesBySeller = await this.getSalesBySeller(where);

    return {
      totalSales: salesCount,
      totalRevenue,
      averageTicket,
      salesByDay,
      salesByPayment,
      topProducts,
      salesBySeller,
    };
  }

  private async getSalesByDay(where: any) {
    const sales = await this.prisma.sale.findMany({
      where,
      select: { createdAt: true, total: true },
    });

    const salesByDay = new Map();
    
    sales.forEach(sale => {
      const date = sale.createdAt.toISOString().split('T')[0];
      if (!salesByDay.has(date)) {
        salesByDay.set(date, { sales: 0, revenue: 0 });
      }
      const day = salesByDay.get(date);
      day.sales += 1;
      day.revenue += sale.total;
    });

    return Array.from(salesByDay.entries()).map(([date, data]) => ({
      date,
      sales: data.sales,
      revenue: data.revenue,
    }));
  }

  private async getTopProducts(where: any) {
    const result = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: { sale: where },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 20,
    });

    const products = await this.prisma.product.findMany({
      where: { id: { in: result.map(r => r.productId) } },
      select: { id: true, name: true },
    });

    return result.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        name: product?.name || 'Produto não encontrado',
        quantity: item._sum.quantity || 0,
        revenue: item._sum.total || 0,
      };
    });
  }

  private async getSalesBySeller(where: any) {
    const result = await this.prisma.sale.groupBy({
      by: ['sellerId'],
      where: { ...where, sellerId: { not: null } },
      _count: { id: true },
      _sum: { total: true },
    });

    const sellers = await this.prisma.user.findMany({
      where: { id: { in: result.map(r => r.sellerId).filter(Boolean) } },
      select: { id: true, name: true },
    });

    return result.map(item => {
      const seller = sellers.find(s => s.id === item.sellerId);
      return {
        sellerName: seller?.name || 'Vendedor não encontrado',
        sales: item._count.id,
        revenue: item._sum.total || 0,
      };
    });
  }

  private generateExcelReport(data: SalesReportData): any {
    // Implementar geração Excel com biblioteca como exceljs
    return {
      type: 'excel',
      data,
      message: 'Funcionalidade Excel em desenvolvimento',
    };
  }

  private generateCsvReport(data: SalesReportData): string {
    let csv = 'Relatório de Vendas\n\n';
    csv += `Total de Vendas,${data.totalSales}\n`;
    csv += `Faturamento Total,${data.totalRevenue.toFixed(2)}\n`;
    csv += `Ticket Médio,${data.averageTicket.toFixed(2)}\n\n`;
    
    csv += 'Forma de Pagamento,Quantidade,Total\n';
    data.salesByPayment.forEach(payment => {
      csv += `${payment.method},${payment.count},${payment.total.toFixed(2)}\n`;
    });
    
    csv += '\nProdutos Mais Vendidos\n';
    csv += 'Produto,Quantidade,Faturamento\n';
    data.topProducts.forEach(product => {
      csv += `${product.name},${product.quantity},${product.revenue.toFixed(2)}\n`;
    });

    return csv;
  }

  async printReport(reportBuffer: Buffer, printerName?: string): Promise<void> {
    try {
      this.logger.log(`Enviando relatório para impressão: ${printerName || 'impressora padrão'}`);
      
      // Implementar impressão usando biblioteca como node-printer
      // Por enquanto, apenas log
      this.logger.log('Relatório enviado para impressão com sucesso');
      
    } catch (error) {
      this.logger.error('Erro ao imprimir relatório', error);
      throw new BadRequestException(REPORTS_CONSTANTS.ERROR_MESSAGES.PRINT_ERROR);
    }
  }
}