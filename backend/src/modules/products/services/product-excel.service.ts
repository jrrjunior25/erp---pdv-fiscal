import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as XLSX from 'xlsx';

interface ProductExcelRow {
  codigo: string;
  codigoBarras?: string;
  nome: string;
  descricao?: string;
  preco: number;
  custo?: number;
  estoque?: number;
  estoqueMinimo?: number;
  categoria?: string;
  unidade?: string;
  ncm?: string;
  cest?: string;
  cfop?: string;
  cstIcms?: string;
  cstPis?: string;
  cstCofins?: string;
  origem?: string;
  aliqIcms?: number;
  aliqPis?: number;
  aliqCofins?: number;
  ativo?: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: Array<{
    row: number;
    errors: string[];
  }>;
}

@Injectable()
export class ProductExcelService {
  constructor(private prisma: PrismaService) {}

  async exportToExcel(): Promise<Buffer> {
    const products = await this.prisma.product.findMany({
      orderBy: { name: 'asc' },
    });

    const data = products.map((product) => ({
      Código: product.code,
      'Código de Barras': product.barcode || '',
      Nome: product.name,
      Descrição: product.description || '',
      'Preço (R$)': product.price,
      'Custo (R$)': product.cost || '',
      Estoque: product.stock,
      'Estoque Mínimo': product.minStock,
      Categoria: product.category || '',
      Unidade: product.unit,
      NCM: product.ncm || '',
      CEST: product.cest || '',
      CFOP: product.cfop || '',
      'CST ICMS': product.cstIcms || '',
      'CST PIS': product.cstPis || '',
      'CST COFINS': product.cstCofins || '',
      Origem: product.origem,
      'Alíq. ICMS (%)': product.aliqIcms || '',
      'Alíq. PIS (%)': product.aliqPis || '',
      'Alíq. COFINS (%)': product.aliqCofins || '',
      Ativo: product.active ? 'SIM' : 'NÃO',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Ajustar largura das colunas
    const columnWidths = [
      { wch: 15 }, // Código
      { wch: 18 }, // Código de Barras
      { wch: 40 }, // Nome
      { wch: 50 }, // Descrição
      { wch: 12 }, // Preço
      { wch: 12 }, // Custo
      { wch: 10 }, // Estoque
      { wch: 15 }, // Estoque Mínimo
      { wch: 20 }, // Categoria
      { wch: 10 }, // Unidade
      { wch: 12 }, // NCM
      { wch: 10 }, // CEST
      { wch: 8 },  // CFOP
      { wch: 12 }, // CST ICMS
      { wch: 12 }, // CST PIS
      { wch: 12 }, // CST COFINS
      { wch: 8 },  // Origem
      { wch: 15 }, // Alíq. ICMS
      { wch: 15 }, // Alíq. PIS
      { wch: 15 }, // Alíq. COFINS
      { wch: 8 },  // Ativo
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async exportTemplate(): Promise<Buffer> {
    const templateData = [
      {
        Código: 'PROD001',
        'Código de Barras': '7891234567890',
        Nome: 'Produto Exemplo',
        Descrição: 'Descrição do produto',
        'Preço (R$)': 100.00,
        'Custo (R$)': 50.00,
        Estoque: 10,
        'Estoque Mínimo': 5,
        Categoria: 'Eletrônicos',
        Unidade: 'UN',
        NCM: '84713012',
        CEST: '0100100',
        CFOP: '5102',
        'CST ICMS': '00',
        'CST PIS': '01',
        'CST COFINS': '01',
        Origem: '0',
        'Alíq. ICMS (%)': 18,
        'Alíq. PIS (%)': 1.65,
        'Alíq. COFINS (%)': 7.6,
        Ativo: 'SIM',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // Adicionar instruções em uma segunda aba
    const instructions = [
      { Campo: 'Código', Obrigatório: 'SIM', Formato: 'Texto único', Exemplo: 'PROD001' },
      { Campo: 'Código de Barras', Obrigatório: 'NÃO', Formato: 'Texto', Exemplo: '7891234567890' },
      { Campo: 'Nome', Obrigatório: 'SIM', Formato: 'Texto', Exemplo: 'Produto Exemplo' },
      { Campo: 'Descrição', Obrigatório: 'NÃO', Formato: 'Texto', Exemplo: 'Descrição detalhada' },
      { Campo: 'Preço (R$)', Obrigatório: 'SIM', Formato: 'Número', Exemplo: '100.00' },
      { Campo: 'Custo (R$)', Obrigatório: 'NÃO', Formato: 'Número', Exemplo: '50.00' },
      { Campo: 'Estoque', Obrigatório: 'NÃO', Formato: 'Número inteiro', Exemplo: '10' },
      { Campo: 'Estoque Mínimo', Obrigatório: 'NÃO', Formato: 'Número inteiro', Exemplo: '5' },
      { Campo: 'Categoria', Obrigatório: 'NÃO', Formato: 'Texto', Exemplo: 'Eletrônicos' },
      { Campo: 'Unidade', Obrigatório: 'NÃO', Formato: 'Texto (UN, KG, LT, etc)', Exemplo: 'UN' },
      { Campo: 'NCM', Obrigatório: 'NÃO', Formato: '8 dígitos numéricos', Exemplo: '84713012' },
      { Campo: 'CEST', Obrigatório: 'NÃO', Formato: '7 dígitos numéricos', Exemplo: '0100100' },
      { Campo: 'CFOP', Obrigatório: 'NÃO', Formato: '4 dígitos numéricos', Exemplo: '5102' },
      { Campo: 'CST ICMS', Obrigatório: 'NÃO', Formato: 'Texto', Exemplo: '00' },
      { Campo: 'CST PIS', Obrigatório: 'NÃO', Formato: 'Texto', Exemplo: '01' },
      { Campo: 'CST COFINS', Obrigatório: 'NÃO', Formato: 'Texto', Exemplo: '01' },
      { Campo: 'Origem', Obrigatório: 'NÃO', Formato: 'Dígito 0-8', Exemplo: '0' },
      { Campo: 'Alíq. ICMS (%)', Obrigatório: 'NÃO', Formato: 'Número (0-100)', Exemplo: '18' },
      { Campo: 'Alíq. PIS (%)', Obrigatório: 'NÃO', Formato: 'Número (0-100)', Exemplo: '1.65' },
      { Campo: 'Alíq. COFINS (%)', Obrigatório: 'NÃO', Formato: 'Número (0-100)', Exemplo: '7.6' },
      { Campo: 'Ativo', Obrigatório: 'NÃO', Formato: 'SIM ou NÃO', Exemplo: 'SIM' },
    ];
    
    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Modelo');
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instruções');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async importFromExcel(buffer: Buffer): Promise<ImportResult> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    const result: ImportResult = {
      success: true,
      imported: 0,
      errors: [],
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // Excel linha começa em 2 (linha 1 é cabeçalho)

      try {
        const validationErrors = this.validateRow(row, rowNumber);
        
        if (validationErrors.length > 0) {
          result.errors.push({
            row: rowNumber,
            errors: validationErrors,
          });
          continue;
        }

        const productData = this.mapRowToProduct(row);

        // Verificar se já existe produto com o mesmo código
        const existingProduct = await this.prisma.product.findUnique({
          where: { code: productData.code },
        });

        if (existingProduct) {
          // Atualizar produto existente
          await this.prisma.product.update({
            where: { code: productData.code },
            data: productData,
          });
        } else {
          // Criar novo produto
          await this.prisma.product.create({
            data: productData,
          });
        }

        result.imported++;
      } catch (error) {
        result.errors.push({
          row: rowNumber,
          errors: [`Erro ao processar: ${error.message}`],
        });
      }
    }

    if (result.errors.length > 0) {
      result.success = false;
    }

    return result;
  }

  private validateRow(row: any, rowNumber: number): string[] {
    const errors: string[] = [];

    // Validar campos obrigatórios
    if (!row['Código'] || row['Código'].toString().trim() === '') {
      errors.push('Campo "Código" é obrigatório');
    }

    if (!row['Nome'] || row['Nome'].toString().trim() === '') {
      errors.push('Campo "Nome" é obrigatório');
    }

    if (!row['Preço (R$)'] && row['Preço (R$)'] !== 0) {
      errors.push('Campo "Preço (R$)" é obrigatório');
    }

    // Validar formato de números
    if (row['Preço (R$)'] && (isNaN(row['Preço (R$)']) || row['Preço (R$)'] < 0)) {
      errors.push('Campo "Preço (R$)" deve ser um número válido e não negativo');
    }

    if (row['Custo (R$)'] && row['Custo (R$)'] !== '' && (isNaN(row['Custo (R$)']) || row['Custo (R$)'] < 0)) {
      errors.push('Campo "Custo (R$)" deve ser um número válido e não negativo');
    }

    // Validar campos fiscais
    if (row['NCM'] && row['NCM'] !== '') {
      const ncm = row['NCM'].toString().replace(/\D/g, '');
      if (ncm.length !== 8) {
        errors.push('NCM deve ter 8 dígitos');
      }
    }

    if (row['CEST'] && row['CEST'] !== '') {
      const cest = row['CEST'].toString().replace(/\D/g, '');
      if (cest.length !== 7) {
        errors.push('CEST deve ter 7 dígitos');
      }
    }

    if (row['CFOP'] && row['CFOP'] !== '') {
      const cfop = row['CFOP'].toString().replace(/\D/g, '');
      if (cfop.length !== 4) {
        errors.push('CFOP deve ter 4 dígitos');
      }
    }

    if (row['Origem'] && row['Origem'] !== '') {
      const origem = row['Origem'].toString();
      if (!/^[0-8]$/.test(origem)) {
        errors.push('Origem deve ser um dígito de 0 a 8');
      }
    }

    // Validar alíquotas
    if (row['Alíq. ICMS (%)'] && row['Alíq. ICMS (%)'] !== '') {
      const aliq = parseFloat(row['Alíq. ICMS (%)']);
      if (isNaN(aliq) || aliq < 0 || aliq > 100) {
        errors.push('Alíq. ICMS deve ser um número entre 0 e 100');
      }
    }

    if (row['Alíq. PIS (%)'] && row['Alíq. PIS (%)'] !== '') {
      const aliq = parseFloat(row['Alíq. PIS (%)']);
      if (isNaN(aliq) || aliq < 0 || aliq > 100) {
        errors.push('Alíq. PIS deve ser um número entre 0 e 100');
      }
    }

    if (row['Alíq. COFINS (%)'] && row['Alíq. COFINS (%)'] !== '') {
      const aliq = parseFloat(row['Alíq. COFINS (%)']);
      if (isNaN(aliq) || aliq < 0 || aliq > 100) {
        errors.push('Alíq. COFINS deve ser um número entre 0 e 100');
      }
    }

    return errors;
  }

  private mapRowToProduct(row: any): any {
    const parseOptionalNumber = (value: any): number | undefined => {
      if (value === '' || value === null || value === undefined) return undefined;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? undefined : parsed;
    };

    const parseOptionalInt = (value: any): number | undefined => {
      if (value === '' || value === null || value === undefined) return undefined;
      const parsed = parseInt(value);
      return isNaN(parsed) ? undefined : parsed;
    };

    const parseOptionalString = (value: any): string | undefined => {
      if (value === '' || value === null || value === undefined) return undefined;
      return value.toString().trim();
    };

    const normalizeDigits = (value: any, length: number): string | undefined => {
      if (!value || value === '') return undefined;
      return value.toString().replace(/\D/g, '').padStart(length, '0');
    };

    return {
      code: row['Código'].toString().trim(),
      barcode: parseOptionalString(row['Código de Barras']),
      name: row['Nome'].toString().trim(),
      description: parseOptionalString(row['Descrição']),
      price: parseFloat(row['Preço (R$)']),
      cost: parseOptionalNumber(row['Custo (R$)']),
      stock: parseOptionalInt(row['Estoque']) ?? 0,
      minStock: parseOptionalInt(row['Estoque Mínimo']) ?? 0,
      category: parseOptionalString(row['Categoria']),
      unit: parseOptionalString(row['Unidade']) || 'UN',
      ncm: normalizeDigits(row['NCM'], 8),
      cest: normalizeDigits(row['CEST'], 7),
      cfop: normalizeDigits(row['CFOP'], 4),
      cstIcms: parseOptionalString(row['CST ICMS']),
      cstPis: parseOptionalString(row['CST PIS']),
      cstCofins: parseOptionalString(row['CST COFINS']),
      origem: parseOptionalString(row['Origem']) || '0',
      aliqIcms: parseOptionalNumber(row['Alíq. ICMS (%)']),
      aliqPis: parseOptionalNumber(row['Alíq. PIS (%)']),
      aliqCofins: parseOptionalNumber(row['Alíq. COFINS (%)']),
      active: row['Ativo'] ? row['Ativo'].toString().toUpperCase() !== 'NÃO' && row['Ativo'].toString().toUpperCase() !== 'NAO' : true,
    };
  }
}
