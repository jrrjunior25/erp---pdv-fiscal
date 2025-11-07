import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

interface DANFEData {
  number: number;
  series: number;
  key: string;
  dateTime: Date;
  total: number;
  status: string;
  protocol?: string;
  emitter: {
    name: string;
    fantasyName: string;
    cnpj: string;
    ie: string;
    address: string;
  };
  recipient: {
    name: string;
    cnpj?: string;
    cpf?: string;
    ie?: string;
    address: string;
  };
  items: Array<{
    code: string;
    name: string;
    ncm: string;
    cfop: string;
    quantity: number;
    unitPrice: number;
    total: number;
    aliqIcms?: number;
    valueIcms?: number;
  }>;
  totals: {
    baseIcms: number;
    valueIcms: number;
    baseSt: number;
    valueSt: number;
    totalProducts: number;
    totalFreight: number;
    totalInsurance: number;
    totalDiscount: number;
    totalOthers: number;
    totalIpi: number;
    totalNfe: number;
  };
  transport?: {
    modality: string;
    carrier?: {
      name?: string;
      cnpj?: string;
      address?: string;
    };
  };
  payment?: {
    method: string;
    installments?: Array<{
      number: number;
      dueDate: Date;
      value: number;
    }>;
  };
}

@Injectable()
export class DanfeService {
  private readonly logger = new Logger(DanfeService.name);

  async generateDANFE(data: DANFEData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 20 });
        const chunks: Buffer[] = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Configurações
        const pageWidth = 555;
        const leftMargin = 20;
        const rightMargin = 575;

        // Cabeçalho DANFE
        this.drawHeader(doc, data, pageWidth, leftMargin);
        
        // Dados do emitente e destinatário
        this.drawEmitterRecipient(doc, data, pageWidth, leftMargin);
        
        // Dados da NF-e
        this.drawNfeData(doc, data, pageWidth, leftMargin);
        
        // Produtos/Serviços
        this.drawProducts(doc, data, pageWidth, leftMargin);
        
        // Totais
        this.drawTotals(doc, data, pageWidth, leftMargin);
        
        // Transporte
        this.drawTransport(doc, data, pageWidth, leftMargin);
        
        // Cobrança
        this.drawPayment(doc, data, pageWidth, leftMargin);
        
        // Informações adicionais
        this.drawAdditionalInfo(doc, data, pageWidth, leftMargin);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private drawHeader(doc: PDFKit.PDFDocument, data: DANFEData, pageWidth: number, leftMargin: number) {
    // Título DANFE
    doc.fontSize(16).font('Helvetica-Bold');
    doc.text('DANFE', leftMargin, 30, { width: pageWidth, align: 'center' });
    doc.fontSize(12);
    doc.text('Documento Auxiliar da Nota Fiscal Eletrônica', leftMargin, 50, { width: pageWidth, align: 'center' });
    
    // Tipo de operação
    doc.fontSize(10);
    doc.text('0 - ENTRADA', leftMargin + 400, 30);
    doc.text('1 - SAÍDA', leftMargin + 400, 45);
    
    // Marcar saída
    doc.rect(leftMargin + 470, 42, 8, 8).stroke();
    doc.text('X', leftMargin + 472, 43);
    
    // Número da NF-e
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text(`Nº ${data.number.toString().padStart(9, '0')}`, leftMargin + 400, 65);
    doc.text(`SÉRIE ${data.series.toString().padStart(3, '0')}`, leftMargin + 400, 80);
    
    // Linha separadora
    doc.moveTo(leftMargin, 100).lineTo(leftMargin + pageWidth, 100).stroke();
  }

  private drawEmitterRecipient(doc: PDFKit.PDFDocument, data: DANFEData, pageWidth: number, leftMargin: number) {
    let currentY = 110;
    
    // Emitente
    doc.fontSize(8).font('Helvetica-Bold');
    doc.text('EMITENTE', leftMargin, currentY);
    currentY += 15;
    
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(data.emitter.name, leftMargin, currentY);
    currentY += 12;
    
    doc.fontSize(8).font('Helvetica');
    doc.text(`Nome Fantasia: ${data.emitter.fantasyName}`, leftMargin, currentY);
    currentY += 10;
    doc.text(`CNPJ: ${this.formatCnpj(data.emitter.cnpj)}`, leftMargin, currentY);
    currentY += 10;
    doc.text(`Inscrição Estadual: ${data.emitter.ie}`, leftMargin, currentY);
    currentY += 10;
    doc.text(`Endereço: ${data.emitter.address}`, leftMargin, currentY);
    currentY += 20;
    
    // Destinatário
    doc.fontSize(8).font('Helvetica-Bold');
    doc.text('DESTINATÁRIO / REMETENTE', leftMargin, currentY);
    currentY += 15;
    
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(data.recipient.name, leftMargin, currentY);
    currentY += 12;
    
    doc.fontSize(8).font('Helvetica');
    if (data.recipient.cnpj) {
      doc.text(`CNPJ: ${this.formatCnpj(data.recipient.cnpj)}`, leftMargin, currentY);
    } else if (data.recipient.cpf) {
      doc.text(`CPF: ${this.formatCpf(data.recipient.cpf)}`, leftMargin, currentY);
    }
    currentY += 10;
    
    if (data.recipient.ie) {
      doc.text(`Inscrição Estadual: ${data.recipient.ie}`, leftMargin, currentY);
      currentY += 10;
    }
    
    doc.text(`Endereço: ${data.recipient.address}`, leftMargin, currentY);
    currentY += 20;
    
    // Linha separadora
    doc.moveTo(leftMargin, currentY).lineTo(leftMargin + pageWidth, currentY).stroke();
    
    return currentY + 10;
  }

  private drawNfeData(doc: PDFKit.PDFDocument, data: DANFEData, pageWidth: number, leftMargin: number) {
    let currentY = 280;
    
    // Chave de acesso
    doc.fontSize(8).font('Helvetica-Bold');
    doc.text('CHAVE DE ACESSO', leftMargin, currentY);
    currentY += 12;
    
    doc.fontSize(10).font('Helvetica');
    const formattedKey = data.key.replace(/(\d{4})/g, '$1 ').trim();
    doc.text(formattedKey, leftMargin, currentY);
    currentY += 15;
    
    // Dados da NF-e em colunas
    const col1X = leftMargin;
    const col2X = leftMargin + 140;
    const col3X = leftMargin + 280;
    const col4X = leftMargin + 420;
    
    doc.fontSize(7).font('Helvetica-Bold');
    doc.text('NATUREZA DA OPERAÇÃO', col1X, currentY);
    doc.text('PROTOCOLO DE AUTORIZAÇÃO', col2X, currentY);
    doc.text('INSCRIÇÃO ESTADUAL', col3X, currentY);
    doc.text('DATA/HORA EMISSÃO', col4X, currentY);
    currentY += 10;
    
    doc.fontSize(8).font('Helvetica');
    doc.text('VENDA DE MERCADORIA', col1X, currentY);
    doc.text(data.protocol || 'Pendente', col2X, currentY);
    doc.text(data.emitter.ie, col3X, currentY);
    doc.text(data.dateTime.toLocaleString('pt-BR'), col4X, currentY);
    currentY += 20;
    
    // Linha separadora
    doc.moveTo(leftMargin, currentY).lineTo(leftMargin + pageWidth, currentY).stroke();
    
    return currentY + 10;
  }

  private drawProducts(doc: PDFKit.PDFDocument, data: DANFEData, pageWidth: number, leftMargin: number) {
    let currentY = 360;
    
    // Cabeçalho da tabela de produtos
    doc.fontSize(7).font('Helvetica-Bold');
    doc.text('DADOS DOS PRODUTOS / SERVIÇOS', leftMargin, currentY);
    currentY += 15;
    
    // Cabeçalhos das colunas
    const colWidths = [40, 180, 40, 30, 40, 50, 50, 40, 40, 45];
    let colX = leftMargin;
    
    const headers = ['CÓD.', 'DESCRIÇÃO', 'NCM', 'CFOP', 'UN', 'QUANT.', 'VL. UNIT.', 'VL. TOT.', 'BC ICMS', 'VL. ICMS'];
    
    headers.forEach((header, index) => {
      doc.text(header, colX, currentY, { width: colWidths[index], align: 'center' });
      colX += colWidths[index];
    });
    
    currentY += 12;
    
    // Linha separadora
    doc.moveTo(leftMargin, currentY).lineTo(leftMargin + pageWidth, currentY).stroke();
    currentY += 5;
    
    // Produtos
    doc.fontSize(6).font('Helvetica');
    data.items.forEach((item, index) => {
      if (currentY > 700) { // Nova página se necessário
        doc.addPage();
        currentY = 50;
      }
      
      colX = leftMargin;
      const values = [
        item.code,
        item.name.substring(0, 30),
        item.ncm,
        item.cfop,
        'UN',
        item.quantity.toFixed(2),
        `R$ ${item.unitPrice.toFixed(2)}`,
        `R$ ${item.total.toFixed(2)}`,
        `R$ ${item.total.toFixed(2)}`,
        `R$ ${(item.valueIcms || 0).toFixed(2)}`
      ];
      
      values.forEach((value, colIndex) => {
        doc.text(value, colX, currentY, { width: colWidths[colIndex], align: colIndex === 1 ? 'left' : 'center' });
        colX += colWidths[colIndex];
      });
      
      currentY += 10;
    });
    
    // Linha separadora
    doc.moveTo(leftMargin, currentY + 5).lineTo(leftMargin + pageWidth, currentY + 5).stroke();
    
    return currentY + 15;
  }

  private drawTotals(doc: PDFKit.PDFDocument, data: DANFEData, pageWidth: number, leftMargin: number) {
    let currentY = 500;
    
    // Cálculo dos impostos
    doc.fontSize(8).font('Helvetica-Bold');
    doc.text('CÁLCULO DO IMPOSTO', leftMargin, currentY);
    currentY += 15;
    
    const totalsData = [
      ['BASE DE CÁLC. ICMS', `R$ ${data.totals.baseIcms.toFixed(2)}`],
      ['VALOR DO ICMS', `R$ ${data.totals.valueIcms.toFixed(2)}`],
      ['BASE DE CÁLC. ICMS ST', `R$ ${data.totals.baseSt.toFixed(2)}`],
      ['VALOR ICMS SUBST.', `R$ ${data.totals.valueSt.toFixed(2)}`],
      ['TOTAL DOS PRODUTOS', `R$ ${data.totals.totalProducts.toFixed(2)}`],
      ['VALOR DO FRETE', `R$ ${data.totals.totalFreight.toFixed(2)}`],
      ['VALOR DO SEGURO', `R$ ${data.totals.totalInsurance.toFixed(2)}`],
      ['DESCONTO', `R$ ${data.totals.totalDiscount.toFixed(2)}`],
      ['OUTRAS DESPESAS', `R$ ${data.totals.totalOthers.toFixed(2)}`],
      ['VALOR DO IPI', `R$ ${data.totals.totalIpi.toFixed(2)}`],
      ['VALOR TOTAL DA NOTA', `R$ ${data.totals.totalNfe.toFixed(2)}`]
    ];
    
    doc.fontSize(7).font('Helvetica');
    const colWidth = pageWidth / 4;
    
    totalsData.forEach((item, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = leftMargin + (col * colWidth * 2);
      const y = currentY + (row * 12);
      
      doc.font('Helvetica-Bold').text(item[0], x, y, { width: colWidth });
      doc.font('Helvetica').text(item[1], x + colWidth, y, { width: colWidth, align: 'right' });
    });
    
    return currentY + 80;
  }

  private drawTransport(doc: PDFKit.PDFDocument, data: DANFEData, pageWidth: number, leftMargin: number) {
    let currentY = 600;
    
    doc.fontSize(8).font('Helvetica-Bold');
    doc.text('TRANSPORTADOR / VOLUMES TRANSPORTADOS', leftMargin, currentY);
    currentY += 15;
    
    if (data.transport?.carrier) {
      doc.fontSize(7).font('Helvetica');
      doc.text(`Nome: ${data.transport.carrier.name || 'Não informado'}`, leftMargin, currentY);
      currentY += 10;
      
      if (data.transport.carrier.cnpj) {
        doc.text(`CNPJ: ${this.formatCnpj(data.transport.carrier.cnpj)}`, leftMargin, currentY);
        currentY += 10;
      }
      
      if (data.transport.carrier.address) {
        doc.text(`Endereço: ${data.transport.carrier.address}`, leftMargin, currentY);
        currentY += 10;
      }
    } else {
      doc.fontSize(7).font('Helvetica');
      doc.text('Sem transportador', leftMargin, currentY);
      currentY += 10;
    }
    
    return currentY + 10;
  }

  private drawPayment(doc: PDFKit.PDFDocument, data: DANFEData, pageWidth: number, leftMargin: number) {
    let currentY = 680;
    
    doc.fontSize(8).font('Helvetica-Bold');
    doc.text('DADOS DE COBRANÇA', leftMargin, currentY);
    currentY += 15;
    
    if (data.payment?.installments && data.payment.installments.length > 0) {
      doc.fontSize(7).font('Helvetica-Bold');
      doc.text('PARCELA', leftMargin, currentY);
      doc.text('VENCIMENTO', leftMargin + 100, currentY);
      doc.text('VALOR', leftMargin + 200, currentY);
      currentY += 12;
      
      doc.font('Helvetica');
      data.payment.installments.forEach((installment, index) => {
        doc.text(`${index + 1}`, leftMargin, currentY);
        doc.text(installment.dueDate.toLocaleDateString('pt-BR'), leftMargin + 100, currentY);
        doc.text(`R$ ${installment.value.toFixed(2)}`, leftMargin + 200, currentY);
        currentY += 10;
      });
    } else {
      doc.fontSize(7).font('Helvetica');
      doc.text(`Pagamento: ${data.payment?.method || 'À vista'}`, leftMargin, currentY);
      doc.text(`Valor: R$ ${data.total.toFixed(2)}`, leftMargin + 200, currentY);
    }
    
    return currentY + 10;
  }

  private drawAdditionalInfo(doc: PDFKit.PDFDocument, data: DANFEData, pageWidth: number, leftMargin: number) {
    let currentY = 750;
    
    doc.fontSize(8).font('Helvetica-Bold');
    doc.text('INFORMAÇÕES ADICIONAIS', leftMargin, currentY);
    currentY += 15;
    
    doc.fontSize(7).font('Helvetica');
    doc.text('Documento gerado automaticamente pelo sistema ERP+PDV', leftMargin, currentY);
    currentY += 10;
    doc.text(`Status: ${data.status}`, leftMargin, currentY);
    
    if (data.protocol) {
      currentY += 10;
      doc.text(`Protocolo de Autorização: ${data.protocol}`, leftMargin, currentY);
    }
  }

  private formatCnpj(cnpj: string): string {
    const clean = cnpj.replace(/\D/g, '');
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  private formatCpf(cpf: string): string {
    const clean = cpf.replace(/\D/g, '');
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
}