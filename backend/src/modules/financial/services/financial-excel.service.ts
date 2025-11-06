import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as XLSX from 'xlsx';

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: Array<{ row: number; errors: string[] }>;
}

@Injectable()
export class FinancialExcelService {
  constructor(private prisma: PrismaService) {}

  async exportToExcel(): Promise<Buffer> {
    const movements = await this.prisma.financialMovement.findMany({
      orderBy: { date: 'desc' },
    });

    const data = movements.map((m) => ({
      Tipo: m.type === 'INCOME' ? 'RECEITA' : 'DESPESA',
      Descrição: m.description,
      Valor: m.amount,
      Data: new Date(m.date).toLocaleDateString('pt-BR'),
      Categoria: m.category,
      Status: m.status === 'PAID' ? 'PAGO' : m.status === 'PENDING' ? 'PENDENTE' : 'CANCELADO',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 12 }, { wch: 50 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 12 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Financeiro');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async exportTemplate(): Promise<Buffer> {
    const templateData = [{
      Tipo: 'RECEITA',
      Descrição: 'Venda de produtos',
      Valor: 1500.00,
      Data: '01/01/2025',
      Categoria: 'Vendas',
      Status: 'PAGO',
    }];

    const instructions = [
      { Campo: 'Tipo', Obrigatório: 'SIM', Formato: 'RECEITA ou DESPESA', Exemplo: 'RECEITA' },
      { Campo: 'Descrição', Obrigatório: 'SIM', Formato: 'Texto', Exemplo: 'Venda de produtos' },
      { Campo: 'Valor', Obrigatório: 'SIM', Formato: 'Número', Exemplo: '1500.00' },
      { Campo: 'Data', Obrigatório: 'SIM', Formato: 'DD/MM/AAAA', Exemplo: '01/01/2025' },
      { Campo: 'Categoria', Obrigatório: 'SIM', Formato: 'Texto', Exemplo: 'Vendas' },
      { Campo: 'Status', Obrigatório: 'NÃO', Formato: 'PAGO, PENDENTE ou CANCELADO', Exemplo: 'PAGO' },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(templateData), 'Modelo');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(instructions), 'Instruções');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async importFromExcel(buffer: Buffer): Promise<ImportResult> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const data: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    const result: ImportResult = { success: true, imported: 0, errors: [] };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;

      try {
        const errors = this.validateRow(row);
        if (errors.length > 0) {
          result.errors.push({ row: rowNumber, errors });
          continue;
        }

        const [day, month, year] = row['Data'].split('/');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

        const movementData = {
          type: row['Tipo'].toUpperCase() === 'RECEITA' ? 'INCOME' : 'EXPENSE',
          description: row['Descrição'].toString().trim(),
          amount: parseFloat(row['Valor']),
          date: date,
          category: row['Categoria'].toString().trim(),
          status: row['Status'] ? 
            (row['Status'].toUpperCase() === 'PAGO' ? 'PAID' : 
             row['Status'].toUpperCase() === 'CANCELADO' ? 'CANCELLED' : 'PENDING') : 'PENDING',
        };

        await this.prisma.financialMovement.create({ data: movementData });
        result.imported++;
      } catch (error) {
        result.errors.push({ row: rowNumber, errors: [`Erro: ${error.message}`] });
      }
    }

    if (result.errors.length > 0) result.success = false;
    return result;
  }

  private validateRow(row: any): string[] {
    const errors: string[] = [];
    
    if (!row['Tipo'] || !['RECEITA', 'DESPESA'].includes(row['Tipo'].toUpperCase())) {
      errors.push('Campo "Tipo" deve ser RECEITA ou DESPESA');
    }
    
    if (!row['Descrição'] || row['Descrição'].toString().trim() === '') {
      errors.push('Campo "Descrição" é obrigatório');
    }
    
    if (!row['Valor'] || isNaN(parseFloat(row['Valor']))) {
      errors.push('Campo "Valor" deve ser um número válido');
    }
    
    if (!row['Data']) {
      errors.push('Campo "Data" é obrigatório');
    }
    
    if (!row['Categoria'] || row['Categoria'].toString().trim() === '') {
      errors.push('Campo "Categoria" é obrigatório');
    }
    
    return errors;
  }
}
