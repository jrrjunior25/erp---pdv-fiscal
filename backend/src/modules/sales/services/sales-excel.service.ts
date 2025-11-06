import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as XLSX from 'xlsx';

@Injectable()
export class SalesExcelService {
  constructor(private prisma: PrismaService) {}

  async exportToExcel(): Promise<Buffer> {
    const sales = await this.prisma.sale.findMany({
      include: {
        customer: true,
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = sales.map((s) => ({
      'Data/Hora': s.createdAt.toLocaleString('pt-BR'),
      Cliente: s.customer?.name || 'Não identificado',
      'Método Pagamento': s.paymentMethod,
      'Qtd Itens': s.items.reduce((sum, item) => sum + item.quantity, 0),
      Desconto: s.discount || 0,
      Total: s.total,
      'Pontos Ganhos': (s as any).loyaltyPointsEarned || 0,
      'Pontos Usados': (s as any).loyaltyPointsRedeemed || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 18 }, { wch: 25 }, { wch: 15 }, { wch: 10 }, 
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendas');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async exportTemplate(): Promise<Buffer> {
    const templateData = [{
      'Data/Hora': '01/01/2024 10:30:00',
      Cliente: 'João Silva',
      'Método Pagamento': 'PIX',
      'Qtd Itens': 3,
      Desconto: 5.00,
      Total: 45.90,
      'Pontos Ganhos': 4,
      'Pontos Usados': 0,
    }];

    const instructions = [
      { Campo: 'Data/Hora', Formato: 'DD/MM/AAAA HH:MM:SS', Exemplo: '01/01/2024 10:30:00' },
      { Campo: 'Cliente', Formato: 'Texto', Exemplo: 'João Silva' },
      { Campo: 'Método Pagamento', Formato: 'PIX, Dinheiro, Crédito, Débito', Exemplo: 'PIX' },
      { Campo: 'Qtd Itens', Formato: 'Número inteiro', Exemplo: '3' },
      { Campo: 'Desconto', Formato: 'Número decimal', Exemplo: '5.00' },
      { Campo: 'Total', Formato: 'Número decimal', Exemplo: '45.90' },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(templateData), 'Modelo');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(instructions), 'Instruções');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}