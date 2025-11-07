import { Injectable, Logger } from '@nestjs/common';
import { create } from 'xmlbuilder2';
import * as crypto from 'crypto';

interface NFEItem {
  code: string;
  name: string;
  ncm: string;
  cfop: string;
  quantity: number;
  unitPrice: number;
  total: number;
  cstIcms: string;
  cstPis: string;
  cstCofins: string;
  aliqIcms?: number;
  aliqPis?: number;
  aliqCofins?: number;
  origem: string;
}

interface NFEData {
  number: number;
  series: number;
  dateTime: Date;
  items: NFEItem[];
  total: number;
  emitter: {
    cnpj: string;
    name: string;
    fantasyName: string;
    ie: string;
    address: {
      street: string;
      number: string;
      neighborhood: string;
      city: string;
      cityCode: string;
      state: string;
      zipCode: string;
    };
  };
  recipient: {
    cnpj?: string;
    cpf?: string;
    name: string;
    ie?: string;
    address: {
      street: string;
      number: string;
      neighborhood: string;
      city: string;
      cityCode: string;
      state: string;
      zipCode: string;
    };
  };
  transport?: {
    modality: string;
    carrier?: {
      cnpj?: string;
      name?: string;
      ie?: string;
    };
  };
  payment: {
    method: string;
    installments?: Array<{
      number: number;
      dueDate: Date;
      value: number;
    }>;
  };
}

@Injectable()
export class NfeService {
  private readonly logger = new Logger(NfeService.name);

  /**
   * Gera o XML da NF-e conforme layout 4.00 da SEFAZ
   */
  generateNFEXML(data: NFEData): string {
    this.logger.log(`Gerando NF-e número ${data.number}`);

    // Gerar chave de acesso (44 dígitos)
    const accessKey = this.generateAccessKey(data);
    this.logger.log(`Chave de acesso gerada: ${accessKey}`);

    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('nfeProc', {
        xmlns: 'http://www.portalfiscal.inf.br/nfe',
        versao: '4.00',
      })
      .ele('NFe', { xmlns: 'http://www.portalfiscal.inf.br/nfe' })
      .ele('infNFe', { versao: '4.00', Id: `NFe${accessKey}` });
    
    // Adicionar chave de acesso como elemento separado
    root.ele('chNFe').txt(accessKey);

    // 1. Identificação
    const ide = root.ele('ide');
    ide.ele('cUF').txt('35'); // SP
    ide.ele('cNF').txt(this.generateRandomCode());
    ide.ele('natOp').txt('VENDA DE MERCADORIA');
    ide.ele('mod').txt('55'); // NF-e
    ide.ele('serie').txt(data.series.toString());
    ide.ele('nNF').txt(data.number.toString());
    ide.ele('dhEmi').txt(data.dateTime.toISOString());
    ide.ele('tpNF').txt('1'); // Saída
    ide.ele('idDest').txt(this.getDestinationType(data.recipient));
    ide.ele('cMunFG').txt(data.emitter.address.cityCode);
    ide.ele('tpImp').txt('1'); // DANFE Retrato
    ide.ele('tpEmis').txt('1'); // Normal
    ide.ele('cDV').txt(accessKey.charAt(43));
    ide.ele('tpAmb').txt('2'); // Homologação (use '1' para produção)
    ide.ele('finNFe').txt('1'); // Normal
    ide.ele('indFinal').txt(data.recipient.cpf ? '1' : '0'); // Consumidor final se CPF
    ide.ele('indPres').txt('1'); // Presencial
    ide.ele('procEmi').txt('0'); // Aplicativo próprio
    ide.ele('verProc').txt('1.0.0');

    // 2. Emitente
    const emit = root.ele('emit');
    emit.ele('CNPJ').txt(data.emitter.cnpj.replace(/\D/g, ''));
    emit.ele('xNome').txt(data.emitter.name);
    emit.ele('xFant').txt(data.emitter.fantasyName);
    
    const enderEmit = emit.ele('enderEmit');
    enderEmit.ele('xLgr').txt(data.emitter.address.street);
    enderEmit.ele('nro').txt(data.emitter.address.number);
    enderEmit.ele('xBairro').txt(data.emitter.address.neighborhood);
    enderEmit.ele('cMun').txt(data.emitter.address.cityCode);
    enderEmit.ele('xMun').txt(data.emitter.address.city);
    enderEmit.ele('UF').txt(data.emitter.address.state);
    enderEmit.ele('CEP').txt(data.emitter.address.zipCode.replace(/\D/g, ''));
    enderEmit.ele('cPais').txt('1058');
    enderEmit.ele('xPais').txt('Brasil');
    
    emit.ele('IE').txt(data.emitter.ie.replace(/\D/g, ''));
    emit.ele('CRT').txt('1'); // Simples Nacional

    // 3. Destinatário
    const dest = root.ele('dest');
    if (data.recipient.cnpj) {
      dest.ele('CNPJ').txt(data.recipient.cnpj.replace(/\D/g, ''));
    } else if (data.recipient.cpf) {
      dest.ele('CPF').txt(data.recipient.cpf.replace(/\D/g, ''));
    }
    dest.ele('xNome').txt(data.recipient.name);
    
    const enderDest = dest.ele('enderDest');
    enderDest.ele('xLgr').txt(data.recipient.address.street);
    enderDest.ele('nro').txt(data.recipient.address.number);
    enderDest.ele('xBairro').txt(data.recipient.address.neighborhood);
    enderDest.ele('cMun').txt(data.recipient.address.cityCode);
    enderDest.ele('xMun').txt(data.recipient.address.city);
    enderDest.ele('UF').txt(data.recipient.address.state);
    enderDest.ele('CEP').txt(data.recipient.address.zipCode.replace(/\D/g, ''));
    enderDest.ele('cPais').txt('1058');
    enderDest.ele('xPais').txt('Brasil');
    
    if (data.recipient.ie) {
      dest.ele('IE').txt(data.recipient.ie.replace(/\D/g, ''));
    } else {
      dest.ele('indIEDest').txt('9'); // Não contribuinte
    }

    // 4. Produtos
    let totalProdutos = 0;
    let totalIcms = 0;
    let totalPis = 0;
    let totalCofins = 0;

    data.items.forEach((item, index) => {
      const det = root.ele('det', { nItem: (index + 1).toString() });
      
      const prod = det.ele('prod');
      prod.ele('cProd').txt(item.code);
      prod.ele('cEAN').txt('SEM GTIN');
      prod.ele('xProd').txt(item.name);
      prod.ele('NCM').txt(item.ncm);
      prod.ele('CFOP').txt(item.cfop);
      prod.ele('uCom').txt('UN');
      prod.ele('qCom').txt(item.quantity.toFixed(4));
      prod.ele('vUnCom').txt(item.unitPrice.toFixed(2));
      prod.ele('vProd').txt(item.total.toFixed(2));
      prod.ele('cEANTrib').txt('SEM GTIN');
      prod.ele('uTrib').txt('UN');
      prod.ele('qTrib').txt(item.quantity.toFixed(4));
      prod.ele('vUnTrib').txt(item.unitPrice.toFixed(2));
      prod.ele('indTot').txt('1');

      totalProdutos += item.total;

      // Impostos
      const imposto = det.ele('imposto');
      
      // ICMS
      const icms = imposto.ele('ICMS');
      if (item.cstIcms === '102') {
        const icmsSn = icms.ele('ICMSSN102');
        icmsSn.ele('orig').txt(item.origem);
        icmsSn.ele('CSOSN').txt(item.cstIcms);
      } else if (item.aliqIcms && item.aliqIcms > 0) {
        const icms00 = icms.ele('ICMS00');
        icms00.ele('orig').txt(item.origem);
        icms00.ele('CST').txt(item.cstIcms);
        icms00.ele('modBC').txt('3');
        icms00.ele('vBC').txt(item.total.toFixed(2));
        icms00.ele('pICMS').txt(item.aliqIcms.toFixed(2));
        const vIcms = (item.total * item.aliqIcms) / 100;
        icms00.ele('vICMS').txt(vIcms.toFixed(2));
        totalIcms += vIcms;
      }

      // PIS
      const pis = imposto.ele('PIS');
      if (item.aliqPis && item.aliqPis > 0) {
        const pisAliq = pis.ele('PISAliq');
        pisAliq.ele('CST').txt(item.cstPis);
        pisAliq.ele('vBC').txt(item.total.toFixed(2));
        pisAliq.ele('pPIS').txt(item.aliqPis.toFixed(4));
        const vPis = (item.total * item.aliqPis) / 100;
        pisAliq.ele('vPIS').txt(vPis.toFixed(2));
        totalPis += vPis;
      } else {
        const pisNt = pis.ele('PISNT');
        pisNt.ele('CST').txt(item.cstPis);
      }

      // COFINS
      const cofins = imposto.ele('COFINS');
      if (item.aliqCofins && item.aliqCofins > 0) {
        const cofinsAliq = cofins.ele('COFINSAliq');
        cofinsAliq.ele('CST').txt(item.cstCofins);
        cofinsAliq.ele('vBC').txt(item.total.toFixed(2));
        cofinsAliq.ele('pCOFINS').txt(item.aliqCofins.toFixed(4));
        const vCofins = (item.total * item.aliqCofins) / 100;
        cofinsAliq.ele('vCOFINS').txt(vCofins.toFixed(2));
        totalCofins += vCofins;
      } else {
        const cofinsNt = cofins.ele('COFINSNT');
        cofinsNt.ele('CST').txt(item.cstCofins);
      }
    });

    // 5. Totais
    const total = root.ele('total').ele('ICMSTot');
    total.ele('vBC').txt('0.00');
    total.ele('vICMS').txt(totalIcms.toFixed(2));
    total.ele('vICMSDeson').txt('0.00');
    total.ele('vFCP').txt('0.00');
    total.ele('vBCST').txt('0.00');
    total.ele('vST').txt('0.00');
    total.ele('vFCPST').txt('0.00');
    total.ele('vFCPSTRet').txt('0.00');
    total.ele('vProd').txt(totalProdutos.toFixed(2));
    total.ele('vFrete').txt('0.00');
    total.ele('vSeg').txt('0.00');
    total.ele('vDesc').txt('0.00');
    total.ele('vII').txt('0.00');
    total.ele('vIPI').txt('0.00');
    total.ele('vIPIDevol').txt('0.00');
    total.ele('vPIS').txt(totalPis.toFixed(2));
    total.ele('vCOFINS').txt(totalCofins.toFixed(2));
    total.ele('vOutro').txt('0.00');
    total.ele('vNF').txt(data.total.toFixed(2));

    // 6. Transporte
    const transp = root.ele('transp');
    transp.ele('modFrete').txt(data.transport?.modality || '9'); // Sem frete

    if (data.transport?.carrier) {
      const transporta = transp.ele('transporta');
      if (data.transport.carrier.cnpj) {
        transporta.ele('CNPJ').txt(data.transport.carrier.cnpj.replace(/\D/g, ''));
      }
      if (data.transport.carrier.name) {
        transporta.ele('xNome').txt(data.transport.carrier.name);
      }
      if (data.transport.carrier.ie) {
        transporta.ele('IE').txt(data.transport.carrier.ie.replace(/\D/g, ''));
      }
    }

    // 7. Cobrança/Pagamento
    const cobr = root.ele('cobr');
    const fat = cobr.ele('fat');
    fat.ele('nFat').txt(data.number.toString());
    fat.ele('vOrig').txt(data.total.toFixed(2));
    fat.ele('vLiq').txt(data.total.toFixed(2));

    if (data.payment.installments && data.payment.installments.length > 0) {
      data.payment.installments.forEach((installment, index) => {
        const dup = cobr.ele('dup');
        dup.ele('nDup').txt(`${data.number.toString().padStart(3, '0')}-${(index + 1).toString().padStart(2, '0')}`);
        dup.ele('dVenc').txt(installment.dueDate.toISOString().split('T')[0]);
        dup.ele('vDup').txt(installment.value.toFixed(2));
      });
    }

    // 8. Pagamento (NF-e 4.00)
    const pag = root.ele('pag');
    const detPag = pag.ele('detPag');
    detPag.ele('indPag').txt('0'); // Pagamento à vista
    detPag.ele('tPag').txt(this.getPaymentCode(data.payment.method));
    detPag.ele('vPag').txt(data.total.toFixed(2));

    // 9. Informações Adicionais
    const infAdic = root.ele('infAdic');
    infAdic.ele('infCpl').txt('NF-e gerada pelo sistema ERP+PDV - Documento auxiliar da Nota Fiscal Eletrônica');

    const xml = root.end({ prettyPrint: true });
    
    this.logger.log('XML NF-e gerado com sucesso');
    return xml;
  }

  /**
   * Gera a chave de acesso da NF-e (44 dígitos)
   */
  private generateAccessKey(data: NFEData): string {
    const uf = '35'; // SP
    const aamm = this.formatDate(data.dateTime);
    const cnpj = data.emitter.cnpj.replace(/\D/g, '');
    const mod = '55'; // NF-e
    const serie = data.series.toString().padStart(3, '0');
    const numero = data.number.toString().padStart(9, '0');
    const tpEmis = '1';
    const cNF = this.generateRandomCode();

    const base = uf + aamm + cnpj + mod + serie + numero + tpEmis + cNF;
    const dv = this.calculateDV(base);

    return base + dv;
  }

  /**
   * Determina o tipo de destinatário
   */
  private getDestinationType(recipient: any): string {
    if (recipient.address.state === 'SP') {
      return '1'; // Operação interna
    }
    return '2'; // Operação interestadual
  }

  /**
   * Converte método de pagamento para código SEFAZ
   */
  private getPaymentCode(method: string): string {
    const paymentCodes = {
      'DINHEIRO': '01',
      'CHEQUE': '02',
      'CARTAO_CREDITO': '03',
      'CARTAO_DEBITO': '04',
      'CREDITO_LOJA': '05',
      'PIX': '17',
      'TRANSFERENCIA': '18',
      'BOLETO': '15',
    };
    return paymentCodes[method] || '99'; // Outros
  }

  /**
   * Formata data para AAMM
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear().toString().substr(2, 2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return year + month;
  }

  /**
   * Gera código numérico aleatório de 8 dígitos
   */
  private generateRandomCode(): string {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  }

  /**
   * Calcula dígito verificador da chave de acesso
   */
  private calculateDV(key: string): string {
    const weights = [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < key.length; i++) {
      sum += parseInt(key[i]) * weights[i];
    }

    const remainder = sum % 11;
    const dv = remainder < 2 ? 0 : 11 - remainder;

    return dv.toString();
  }

  /**
   * Valida estrutura do XML NF-e
   */
  validateNFEXML(xml: string): boolean {
    try {
      if (!xml || xml.length < 100) {
        return false;
      }

      const requiredTags = ['<NFe', '<infNFe', '<ide', '<emit', '<dest', '<det', '<total', '<transp', '<cobr', '<pag'];
      return requiredTags.every(tag => xml.includes(tag));
    } catch (error) {
      this.logger.error('Erro ao validar XML NF-e', error);
      return false;
    }
  }
}