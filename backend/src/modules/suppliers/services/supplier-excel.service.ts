import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as XLSX from 'xlsx';

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: Array<{ row: number; errors: string[] }>;
}

@Injectable()
export class SupplierExcelService {
  constructor(private prisma: PrismaService) {}

  async exportToExcel(): Promise<Buffer> {
    const suppliers = await this.prisma.supplier.findMany({
      orderBy: { name: 'asc' },
    });

    const data = suppliers.map((s) => ({
      Nome: s.name,
      'CPF/CNPJ': s.document || '',
      Email: s.email || '',
      Telefone: s.phone || '',
      Endereço: s.address || '',
      Cidade: s.city || '',
      Estado: s.state || '',
      CEP: s.zipCode || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 40 }, { wch: 18 }, { wch: 30 }, { wch: 15 },
      { wch: 40 }, { wch: 25 }, { wch: 5 }, { wch: 12 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fornecedores');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async exportTemplate(): Promise<Buffer> {
    const templateData = [{
      Nome: 'Fornecedor Exemplo LTDA',
      'CPF/CNPJ': '12345678000190',
      Email: 'contato@fornecedor.com',
      Telefone: '1133334444',
      Endereço: 'Av. Exemplo, 456',
      Cidade: 'São Paulo',
      Estado: 'SP',
      CEP: '01234567',
    }];

    const instructions = [
      { Campo: 'Nome', Obrigatório: 'SIM', Formato: 'Texto', Exemplo: 'Fornecedor Exemplo LTDA' },
      { Campo: 'CPF/CNPJ', Obrigatório: 'NÃO', Formato: 'Apenas números', Exemplo: '12345678000190' },
      { Campo: 'Email', Obrigatório: 'NÃO', Formato: 'Email válido', Exemplo: 'contato@fornecedor.com' },
      { Campo: 'Telefone', Obrigatório: 'NÃO', Formato: 'Apenas números', Exemplo: '1133334444' },
      { Campo: 'Endereço', Obrigatório: 'NÃO', Formato: 'Texto', Exemplo: 'Av. Exemplo, 456' },
      { Campo: 'Cidade', Obrigatório: 'NÃO', Formato: 'Texto', Exemplo: 'São Paulo' },
      { Campo: 'Estado', Obrigatório: 'NÃO', Formato: 'UF (2 letras)', Exemplo: 'SP' },
      { Campo: 'CEP', Obrigatório: 'NÃO', Formato: 'Apenas números', Exemplo: '01234567' },
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

        const supplierData = {
          name: row['Nome'].toString().trim(),
          document: row['CPF/CNPJ'] ? row['CPF/CNPJ'].toString().replace(/\D/g, '') : null,
          email: row['Email'] || null,
          phone: row['Telefone'] ? row['Telefone'].toString().replace(/\D/g, '') : null,
          address: row['Endereço'] || null,
          city: row['Cidade'] || null,
          state: row['Estado'] || null,
          zipCode: row['CEP'] ? row['CEP'].toString().replace(/\D/g, '') : null,
        };

        if (supplierData.document) {
          const existing = await this.prisma.supplier.findUnique({ where: { document: supplierData.document } });
          if (existing) {
            await this.prisma.supplier.update({ where: { id: existing.id }, data: supplierData });
          } else {
            await this.prisma.supplier.create({ data: supplierData });
          }
        } else {
          await this.prisma.supplier.create({ data: supplierData });
        }

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
    if (!row['Nome'] || row['Nome'].toString().trim() === '') {
      errors.push('Campo "Nome" é obrigatório');
    }
    return errors;
  }
}
