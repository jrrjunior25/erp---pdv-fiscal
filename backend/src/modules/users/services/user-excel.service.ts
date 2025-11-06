import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as XLSX from 'xlsx';
import * as bcrypt from 'bcrypt';

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: Array<{ row: number; errors: string[] }>;
}

@Injectable()
export class UserExcelService {
  constructor(private prisma: PrismaService) {}

  async exportToExcel(): Promise<Buffer> {
    const users = await this.prisma.user.findMany({
      orderBy: { name: 'asc' },
    });

    const data = users.map((u) => ({
      Nome: u.name,
      Email: u.email,
      Função: u.role,
      Status: u.active ? 'Ativo' : 'Inativo',
      'Criado em': u.createdAt.toLocaleDateString('pt-BR'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 30 }, { wch: 35 }, { wch: 15 }, { wch: 10 }, { wch: 12 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuários');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async exportTemplate(): Promise<Buffer> {
    const templateData = [{
      Nome: 'João Silva',
      Email: 'joao@empresa.com',
      Senha: 'senha123',
      Função: 'CASHIER',
      Status: 'Ativo',
    }];

    const instructions = [
      { Campo: 'Nome', Obrigatório: 'SIM', Formato: 'Texto', Exemplo: 'João Silva' },
      { Campo: 'Email', Obrigatório: 'SIM', Formato: 'Email válido', Exemplo: 'joao@empresa.com' },
      { Campo: 'Senha', Obrigatório: 'SIM', Formato: 'Texto (min 6 chars)', Exemplo: 'senha123' },
      { Campo: 'Função', Obrigatório: 'SIM', Formato: 'ADMIN, MANAGER, CASHIER', Exemplo: 'CASHIER' },
      { Campo: 'Status', Obrigatório: 'SIM', Formato: 'Ativo ou Inativo', Exemplo: 'Ativo' },
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

        const hashedPassword = await bcrypt.hash(row['Senha'], 10);

        const userData = {
          name: row['Nome'].toString().trim(),
          email: row['Email'].toString().trim().toLowerCase(),
          password: hashedPassword,
          role: row['Função'].toString().toUpperCase(),
          active: row['Status'].toString().toLowerCase() === 'ativo',
        };

        const existing = await this.prisma.user.findUnique({ where: { email: userData.email } });
        if (existing) {
          await this.prisma.user.update({ 
            where: { id: existing.id }, 
            data: { ...userData, password: existing.password }
          });
        } else {
          await this.prisma.user.create({ data: userData });
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
    
    if (!row['Email'] || !row['Email'].toString().includes('@')) {
      errors.push('Campo "Email" deve ser um email válido');
    }
    
    if (!row['Senha'] || row['Senha'].toString().length < 6) {
      errors.push('Campo "Senha" deve ter pelo menos 6 caracteres');
    }
    
    const validRoles = ['ADMIN', 'MANAGER', 'CASHIER'];
    if (!row['Função'] || !validRoles.includes(row['Função'].toString().toUpperCase())) {
      errors.push('Campo "Função" deve ser: ADMIN, MANAGER ou CASHIER');
    }
    
    const validStatus = ['ativo', 'inativo'];
    if (!row['Status'] || !validStatus.includes(row['Status'].toString().toLowerCase())) {
      errors.push('Campo "Status" deve ser: Ativo ou Inativo');
    }
    
    return errors;
  }
}