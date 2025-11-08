import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';

@Injectable()
export class InventoryReportService {
  private readonly logger = new Logger(InventoryReportService.name);

  constructor(private prisma: PrismaService) {}

  async generateStockReportPDF(filters?: {
    category?: string;
    supplierId?: string;
    lowStock?: boolean;
  }): Promise<Buffer> {
    const products = await this.getFilteredProducts(filters);
    
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const chunks: Buffer[] = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Cabeçalho
        doc.fontSize(18).font('Helvetica-Bold').text('Relatório de Estoque', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
        doc.moveDown();

        // Filtros aplicados
        if (filters?.category) doc.text(`Categoria: ${filters.category}`);
        if (filters?.lowStock) doc.text('Filtro: Estoque Baixo');
        doc.moveDown();

        // Tabela
        const tableTop = doc.y;
        const colWidths = [150, 80, 80, 100, 100];
        
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Produto', 40, tableTop, { width: colWidths[0] });
        doc.text('Estoque', 190, tableTop, { width: colWidths[1] });
        doc.text('Mín.', 270, tableTop, { width: colWidths[2] });
        doc.text('Valor Unit.', 350, tableTop, { width: colWidths[3] });
        doc.text('Valor Total', 450, tableTop, { width: colWidths[4] });

        let y = tableTop + 20;
        doc.fontSize(8).font('Helvetica');

        products.forEach(p => {
          if (y > 750) {
            doc.addPage();
            y = 40;
          }
          
          const stock = p.stock || 0;
          const minStock = p.minStock || 0;
          const price = p.price || 0;
          const total = stock * price;

          doc.text(p.name.substring(0, 30), 40, y, { width: colWidths[0] });
          doc.text(stock.toString(), 190, y, { width: colWidths[1] });
          doc.text(minStock.toString(), 270, y, { width: colWidths[2] });
          doc.text(`R$ ${price.toFixed(2)}`, 350, y, { width: colWidths[3] });
          doc.text(`R$ ${total.toFixed(2)}`, 450, y, { width: colWidths[4] });
          
          y += 20;
        });

        // Totais
        doc.moveDown(2);
        const totalValue = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || 0)), 0);
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(`Total de Produtos: ${products.length}`, 40);
        doc.text(`Valor Total em Estoque: R$ ${totalValue.toFixed(2)}`, 40);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  async generateStockReportExcel(filters?: {
    category?: string;
    supplierId?: string;
    lowStock?: boolean;
  }): Promise<Buffer> {
    const products = await this.getFilteredProducts(filters);
    const movements = await this.prisma.stockMovement.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: { product: true }
    });

    const workbook = new ExcelJS.Workbook();
    
    // Aba 1: Estoque Atual
    const stockSheet = workbook.addWorksheet('Estoque Atual');
    stockSheet.columns = [
      { header: 'Código', key: 'code', width: 15 },
      { header: 'Produto', key: 'name', width: 30 },
      { header: 'Categoria', key: 'category', width: 20 },
      { header: 'Estoque', key: 'stock', width: 12 },
      { header: 'Mín.', key: 'minStock', width: 10 },
      { header: 'Máx.', key: 'maxStock', width: 10 },
      { header: 'Valor Unit.', key: 'price', width: 15 },
      { header: 'Valor Total', key: 'total', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];

    products.forEach(p => {
      const stock = p.stock || 0;
      const minStock = p.minStock || 0;
      const status = stock <= minStock ? 'BAIXO' : stock <= minStock * 1.5 ? 'ATENÇÃO' : 'OK';
      
      stockSheet.addRow({
        code: p.code,
        name: p.name,
        category: p.category || 'Sem categoria',
        stock,
        minStock,
        maxStock: p.maxStock || 0,
        price: p.price,
        total: stock * (p.price || 0),
        status
      });
    });

    // Estilo do cabeçalho
    stockSheet.getRow(1).font = { bold: true };
    stockSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    stockSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Aba 2: Movimentações
    const movSheet = workbook.addWorksheet('Movimentações');
    movSheet.columns = [
      { header: 'Data', key: 'date', width: 20 },
      { header: 'Produto', key: 'product', width: 30 },
      { header: 'Tipo', key: 'type', width: 15 },
      { header: 'Quantidade', key: 'quantity', width: 12 },
      { header: 'Motivo', key: 'reason', width: 30 }
    ];

    movements.forEach(m => {
      movSheet.addRow({
        date: m.createdAt.toLocaleString('pt-BR'),
        product: m.product?.name || 'N/A',
        type: m.type,
        quantity: m.quantity,
        reason: m.reason || '-'
      });
    });

    movSheet.getRow(1).font = { bold: true };
    movSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
    movSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generateLowStockReportPDF(): Promise<Buffer> {
    return this.generateStockReportPDF({ lowStock: true });
  }

  async generateStockBySupplierPDF(supplierId: string): Promise<Buffer> {
    return this.generateStockReportPDF({ supplierId });
  }

  async generateAuditReportPDF(startDate: Date, endDate: Date): Promise<Buffer> {
    const movements = await this.prisma.stockMovement.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      include: { product: true },
      orderBy: { createdAt: 'desc' }
    });

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const chunks: Buffer[] = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        doc.fontSize(18).font('Helvetica-Bold').text('Relatório de Auditoria de Estoque', { align: 'center' });
        doc.fontSize(10).font('Helvetica');
        doc.text(`Período: ${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}`, { align: 'center' });
        doc.moveDown(2);

        let y = doc.y;
        movements.forEach(m => {
          if (y > 750) {
            doc.addPage();
            y = 40;
          }

          doc.fontSize(9).font('Helvetica-Bold').text(`${m.createdAt.toLocaleString('pt-BR')}`, 40, y);
          doc.fontSize(8).font('Helvetica');
          doc.text(`Produto: ${m.product?.name || 'N/A'}`, 40, y + 15);
          doc.text(`Tipo: ${m.type} | Qtd: ${m.quantity}`, 40, y + 28);
          if (m.reason) doc.text(`Motivo: ${m.reason}`, 40, y + 41);
          
          y += 60;
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private async getFilteredProducts(filters?: {
    category?: string;
    supplierId?: string;
    lowStock?: boolean;
  }) {
    const where: any = {};
    
    if (filters?.category) where.category = filters.category;
    if (filters?.supplierId) where.supplierId = filters.supplierId;
    if (filters?.lowStock) {
      where.stock = { lte: this.prisma.product.fields.minStock };
    }

    return this.prisma.product.findMany({
      where,
      orderBy: { name: 'asc' }
    });
  }
}
