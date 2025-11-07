import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs/promises';
import * as path from 'path';

interface NFCePDFData {
  number: number;
  series: number;
  key: string;
  dateTime: Date;
  total: number;
  status: string;
  qrCodeUrl?: string;
  emitter: {
    name: string;
    cnpj: string;
    address: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  customer?: {
    name?: string;
    cpf?: string;
  };
}

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private readonly baseDir = path.join(process.cwd(), 'storage', 'pdfs');

  async generateNFCePDF(data: NFCePDFData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const chunks: Buffer[] = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Cabeçalho
        doc.fontSize(16).font('Helvetica-Bold').text('NFC-e - Nota Fiscal de Consumidor Eletrônica', { align: 'center' });
        doc.moveDown();

        // Dados do emitente
        doc.fontSize(12).font('Helvetica-Bold').text('EMITENTE');
        doc.font('Helvetica').text(`${data.emitter.name}`);
        doc.text(`CNPJ: ${data.emitter.cnpj}`);
        doc.text(`${data.emitter.address}`);
        doc.moveDown();

        // Dados da NFC-e
        doc.font('Helvetica-Bold').text('DADOS DA NFC-e');
        doc.font('Helvetica').text(`Número: ${data.number.toString().padStart(9, '0')}`);
        doc.text(`Série: ${data.series}`);
        doc.text(`Data/Hora: ${data.dateTime.toLocaleString('pt-BR')}`);
        doc.text(`Chave de Acesso: ${data.key}`);
        doc.text(`Status: ${data.status}`);
        doc.moveDown();

        // Destinatário
        if (data.customer?.cpf) {
          doc.font('Helvetica-Bold').text('DESTINATÁRIO');
          doc.font('Helvetica').text(`Nome: ${data.customer.name || 'Não informado'}`);
          doc.text(`CPF: ${data.customer.cpf}`);
          doc.moveDown();
        }

        // Produtos
        doc.font('Helvetica-Bold').text('PRODUTOS/SERVIÇOS');
        doc.moveDown(0.5);

        // Cabeçalho da tabela
        const tableTop = doc.y;
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('Descrição', 40, tableTop);
        doc.text('Qtd', 350, tableTop);
        doc.text('Valor Unit.', 400, tableTop);
        doc.text('Total', 480, tableTop);

        // Linha separadora
        doc.moveTo(40, doc.y + 5).lineTo(550, doc.y + 5).stroke();
        doc.moveDown(0.5);

        // Itens
        doc.font('Helvetica').fontSize(9);
        data.items.forEach(item => {
          const itemY = doc.y;
          doc.text(item.name.substring(0, 40), 40, itemY);
          doc.text(item.quantity.toString(), 350, itemY);
          doc.text(`R$ ${item.price.toFixed(2)}`, 400, itemY);
          doc.text(`R$ ${item.total.toFixed(2)}`, 480, itemY);
          doc.moveDown(0.8);
        });

        // Total
        doc.moveDown();
        doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text(`TOTAL GERAL: R$ ${data.total.toFixed(2)}`, { align: 'right' });
        doc.moveDown();

        // QR Code (texto)
        if (data.qrCodeUrl) {
          doc.font('Helvetica-Bold').fontSize(10).text('CONSULTE PELA CHAVE DE ACESSO EM:');
          doc.font('Helvetica').fontSize(8).text('www.fazenda.sp.gov.br/nfce');
          doc.moveDown();
          doc.fontSize(6).text(`Chave: ${data.key}`);
        }

        // Rodapé
        doc.moveDown();
        doc.fontSize(8).text('Documento gerado automaticamente pelo sistema ERP+PDV', { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  async savePDF(pdfBuffer: Buffer, nfeKey: string, date: Date): Promise<string> {
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      const dir = path.join(this.baseDir, String(year), month, day);
      await fs.mkdir(dir, { recursive: true });

      const fileName = `${nfeKey}.pdf`;
      const filePath = path.join(dir, fileName);
      
      await fs.writeFile(filePath, pdfBuffer);
      
      this.logger.log(`PDF salvo: ${filePath}`);
      return `local://${year}/${month}/${day}/${fileName}`;
    } catch (error) {
      this.logger.error(`Erro ao salvar PDF: ${error.message}`);
      throw error;
    }
  }

  async getPDF(nfeKey: string, date: Date): Promise<Buffer> {
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      const filePath = path.join(this.baseDir, String(year), month, day, `${nfeKey}.pdf`);
      return await fs.readFile(filePath);
    } catch (error) {
      this.logger.error(`Erro ao recuperar PDF: ${error.message}`);
      throw error;
    }
  }

  async listPDFs(year?: number, month?: number, day?: number) {
    try {
      const currentYear = year || new Date().getFullYear();
      const currentMonth = month || new Date().getMonth() + 1;
      const currentDay = day;

      let searchPath = path.join(this.baseDir, String(currentYear), String(currentMonth).padStart(2, '0'));
      
      if (currentDay) {
        searchPath = path.join(searchPath, String(currentDay).padStart(2, '0'));
      }

      const files = await this.getFilesRecursively(searchPath);
      
      return {
        period: currentDay ? 
          `${String(currentDay).padStart(2, '0')}/${String(currentMonth).padStart(2, '0')}/${currentYear}` :
          `${String(currentMonth).padStart(2, '0')}/${currentYear}`,
        totalPdfs: files.length,
        files: files.map(file => ({
          name: path.basename(file),
          path: file,
          key: path.basename(file, '.pdf'),
        })),
      };
    } catch (error) {
      this.logger.error('Erro ao listar PDFs', error);
      return { period: '', totalPdfs: 0, files: [] };
    }
  }

  private async getFilesRecursively(dir: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const files: string[] = [];

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...await this.getFilesRecursively(fullPath));
        } else if (entry.name.endsWith('.pdf')) {
          files.push(fullPath);
        }
      }

      return files;
    } catch (error) {
      return [];
    }
  }
}