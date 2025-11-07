import { Injectable, Logger } from '@nestjs/common';
import { create } from 'xmlbuilder2';
import * as crypto from 'crypto';

interface NFCeItem {
  code: string;
  name: string;
  ncm: string;
  cfop: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface NFCeData {
  number: number;
  series: number;
  dateTime: Date;
  items: NFCeItem[];
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
  customer?: {
    cpf?: string;
    name?: string;
  };
}

@Injectable()
export class NfceService {
  private readonly logger = new Logger(NfceService.name);

  /**
   * Gera o XML da NFC-e conforme layout 4.00 da SEFAZ
   */
  generateNFCeXML(data: NFCeData): string {
    this.logger.log(`Gerando NFC-e número ${data.number}`);

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
    
    // Adicionar chave de acesso como elemento separado para facilitar extração
    root.ele('chNFe').txt(accessKey);

    // 1. Identificação
    const ide = root.ele('ide');
    ide.ele('cUF').txt('35'); // SP
    ide.ele('cNF').txt(this.generateRandomCode());
    ide.ele('natOp').txt('VENDA');
    ide.ele('mod').txt('65'); // NFC-e
    ide.ele('serie').txt(data.series.toString());
    ide.ele('nNF').txt(data.number.toString());
    ide.ele('dhEmi').txt(data.dateTime.toISOString());
    ide.ele('tpNF').txt('1'); // Saída
    ide.ele('idDest').txt('1'); // Operação interna
    ide.ele('cMunFG').txt(data.emitter.address.cityCode);
    ide.ele('tpImp').txt('4'); // DANFE NFC-e
    ide.ele('tpEmis').txt('1'); // Normal
    ide.ele('cDV').txt(accessKey.charAt(43));
    ide.ele('tpAmb').txt('2'); // Homologação (use '1' para produção)
    ide.ele('finNFe').txt('1'); // Normal
    ide.ele('indFinal').txt('1'); // Consumidor final
    ide.ele('indPres').txt('1'); // Presencial
    ide.ele('procEmi').txt('0'); // Aplicativo próprio
    ide.ele('verProc').txt('1.0.0');

    // 2. Emitente
    const emit = root.ele('emit');
    emit.ele('CNPJ').txt(data.emitter.cnpj);
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
    
    emit.ele('IE').txt(data.emitter.ie);
    emit.ele('CRT').txt('1'); // Simples Nacional

    // 3. Destinatário (se houver)
    if (data.customer?.cpf) {
      const dest = root.ele('dest');
      dest.ele('CPF').txt(data.customer.cpf.replace(/\D/g, ''));
      if (data.customer.name) {
        dest.ele('xNome').txt(data.customer.name);
      }
      dest.ele('indIEDest').txt('9'); // Não contribuinte
    }

    // 4. Produtos
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

      // Impostos (Simples Nacional)
      const imposto = det.ele('imposto');
      
      const icms = imposto.ele('ICMS').ele('ICMSSN102');
      icms.ele('orig').txt('0');
      icms.ele('CSOSN').txt('102');

      const pis = imposto.ele('PIS').ele('PISNT');
      pis.ele('CST').txt('07');

      const cofins = imposto.ele('COFINS').ele('COFINSNT');
      cofins.ele('CST').txt('07');
    });

    // 5. Totais
    const total = root.ele('total').ele('ICMSTot');
    total.ele('vBC').txt('0.00');
    total.ele('vICMS').txt('0.00');
    total.ele('vICMSDeson').txt('0.00');
    total.ele('vFCP').txt('0.00');
    total.ele('vBCST').txt('0.00');
    total.ele('vST').txt('0.00');
    total.ele('vFCPST').txt('0.00');
    total.ele('vFCPSTRet').txt('0.00');
    total.ele('vProd').txt(data.total.toFixed(2));
    total.ele('vFrete').txt('0.00');
    total.ele('vSeg').txt('0.00');
    total.ele('vDesc').txt('0.00');
    total.ele('vII').txt('0.00');
    total.ele('vIPI').txt('0.00');
    total.ele('vIPIDevol').txt('0.00');
    total.ele('vPIS').txt('0.00');
    total.ele('vCOFINS').txt('0.00');
    total.ele('vOutro').txt('0.00');
    total.ele('vNF').txt(data.total.toFixed(2));

    // 6. Pagamento
    const pag = root.ele('pag');
    const detPag = pag.ele('detPag');
    detPag.ele('tPag').txt('01'); // Dinheiro (você pode parametrizar)
    detPag.ele('vPag').txt(data.total.toFixed(2));

    // 7. Informações Adicionais
    const infAdic = root.ele('infAdic');
    infAdic.ele('infCpl').txt('NFC-e gerada pelo sistema ERP+PDV');

    const xml = root.end({ prettyPrint: true });
    
    this.logger.log('XML NFC-e gerado com sucesso');
    this.logger.log(`XML contém chave: ${xml.includes(accessKey)}`);
    return xml;
  }

  /**
   * Gera a chave de acesso da NFC-e (44 dígitos)
   */
  private generateAccessKey(data: NFCeData): string {
    const uf = '35'; // SP
    const aamm = this.formatDate(data.dateTime);
    const cnpj = data.emitter.cnpj.replace(/\D/g, '');
    const mod = '65'; // NFC-e
    const serie = data.series.toString().padStart(3, '0');
    const numero = data.number.toString().padStart(9, '0');
    const tpEmis = '1';
    const cNF = this.generateRandomCode();

    const base = uf + aamm + cnpj + mod + serie + numero + tpEmis + cNF;
    const dv = this.calculateDV(base);

    return base + dv;
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
   * Gera QR Code da NFC-e para consulta
   */
  generateQRCode(accessKey: string, nfeUrl: string): string {
    // URL para consulta do QR Code conforme padrão SEFAZ
    const baseUrl = nfeUrl || 'http://www.fazenda.sp.gov.br/nfce/qrcode';
    return `${baseUrl}?chNFe=${accessKey}&nVersao=100&tpAmb=2`;
  }

  /**
   * Valida estrutura do XML NFC-e
   */
  validateNFCeXML(xml: string): boolean {
    try {
      // Validações básicas
      if (!xml || xml.length < 100) {
        return false;
      }

      // Verifica tags obrigatórias
      const requiredTags = ['<NFe', '<infNFe', '<ide', '<emit', '<det', '<total', '<pag'];
      return requiredTags.every(tag => xml.includes(tag));
    } catch (error) {
      this.logger.error('Erro ao validar XML NFC-e', error);
      return false;
    }
  }
}
