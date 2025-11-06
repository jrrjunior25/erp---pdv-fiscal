import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as XLSX from 'xlsx';

@Injectable()
export class InventoryExcelService {
  constructor(private prisma: PrismaService) {}

  async exportToExcel(): Promise<Buffer> {
    const products = await this.prisma.product.findMany({
      orderBy: { name: 'asc' },
    });

    const data = products.map((product) => ({
      Produto: product.name,
      Código: product.code,
      Categoria: product.category,
      'Qtd Atual': product.stock,
      'Qtd Mínima': product.minStock,
      'Preço Unitário': product.price,
      'Valor Total': product.price * product.stock,
      Status: product.stock === 0 ? 'Zerado' : product.stock < product.minStock ? 'Baixo' : 'OK',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, 
      { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 10 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Estoque');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async exportTemplate(): Promise<Buffer> {
    const templateData = [{
      Produto: 'Produto Exemplo',
      Código: 'PROD001',
      Categoria: 'Eletrônicos',
      'Qtd Atual': 50,
      'Qtd Mínima': 10,
      'Preço Unitário': 29.90,
      'Valor Total': 1495.00,
      Status: 'OK',
    }];

    const instructions = [
      { Campo: 'Produto', Formato: 'Texto', Exemplo: 'Produto Exemplo' },
      { Campo: 'Código', Formato: 'Texto único', Exemplo: 'PROD001' },
      { Campo: 'Categoria', Formato: 'Texto', Exemplo: 'Eletrônicos' },
      { Campo: 'Qtd Atual', Formato: 'Número inteiro', Exemplo: '50' },
      { Campo: 'Qtd Mínima', Formato: 'Número inteiro', Exemplo: '10' },
      { Campo: 'Status', Formato: 'OK, Baixo, Zerado', Exemplo: 'OK' },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(templateData), 'Modelo');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(instructions), 'Instruções');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}