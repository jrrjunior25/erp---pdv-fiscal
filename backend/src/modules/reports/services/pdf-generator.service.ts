import { Injectable } from '@nestjs/common';
import { SalesReportData } from '../interfaces/reports.interface';

// Simulação do PDFKit para evitar erro de compilação
class MockPDFDocument {
  fontSize(size: number) { return this; }
  text(text: string, options?: any) { return this; }
  moveDown() { return this; }
  on(event: string, callback: Function) { return this; }
  end() { return this; }
}

@Injectable()
export class PdfGeneratorService {
  generateSalesReport(data: SalesReportData, filters: any): Buffer {
    // Mock implementation - em produção, instalar: npm install pdfkit @types/pdfkit
    const doc = new MockPDFDocument();
    const mockBuffer = Buffer.from('PDF Mock Content');

    // Header
    doc.fontSize(20).text('RELATÓRIO DE VENDAS', { align: 'center' });
    doc.moveDown();
    
    // Período
    doc.fontSize(12).text(`Período: ${this.formatDate(filters.startDate)} a ${this.formatDate(filters.endDate)}`);
    doc.moveDown();

    // Resumo
    doc.fontSize(16).text('RESUMO GERAL');
    doc.fontSize(12);
    doc.text(`Total de Vendas: ${data.totalSales}`);
    doc.text(`Faturamento Total: R$ ${data.totalRevenue.toFixed(2)}`);
    doc.text(`Ticket Médio: R$ ${data.averageTicket.toFixed(2)}`);
    doc.moveDown();

    // Vendas por Forma de Pagamento
    if (data.salesByPayment.length > 0) {
      doc.fontSize(16).text('VENDAS POR FORMA DE PAGAMENTO');
      doc.fontSize(12);
      data.salesByPayment.forEach(payment => {
        doc.text(`${payment.method}: ${payment.count} vendas - R$ ${payment.total.toFixed(2)}`);
      });
      doc.moveDown();
    }

    // Top Produtos
    if (data.topProducts.length > 0) {
      doc.fontSize(16).text('PRODUTOS MAIS VENDIDOS');
      doc.fontSize(12);
      data.topProducts.slice(0, 10).forEach((product, index) => {
        doc.text(`${index + 1}. ${product.name} - Qtd: ${product.quantity} - R$ ${product.revenue.toFixed(2)}`);
      });
      doc.moveDown();
    }

    // Vendas por Vendedor
    if (data.salesBySeller.length > 0) {
      doc.fontSize(16).text('VENDAS POR VENDEDOR');
      doc.fontSize(12);
      data.salesBySeller.forEach(seller => {
        doc.text(`${seller.sellerName}: ${seller.sales} vendas - R$ ${seller.revenue.toFixed(2)}`);
      });
    }

    // Simulação da geração do PDF
    return mockBuffer;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR');
  }
}