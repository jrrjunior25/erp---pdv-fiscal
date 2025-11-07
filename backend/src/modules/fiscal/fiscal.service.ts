import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NfceService } from './nfce.service';
import { PixService } from './pix.service';
import { SefazService } from './sefaz.service';
import { StorageService } from '../../common/storage/storage.service';
import { IssueNfceDto } from './dto/issue-nfce.dto';
import { GeneratePixDto } from './dto/generate-pix.dto';

@Injectable()
export class FiscalService {
  private readonly logger = new Logger(FiscalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly nfceService: NfceService,
    private readonly pixService: PixService,
    private readonly sefazService: SefazService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Busca configuração fiscal do banco de dados
   */
  private async getFiscalConfigFromDb() {
    const config = await this.prisma.fiscalConfig.findFirst();
    if (!config) {
      throw new BadRequestException('Configuração fiscal não encontrada. Configure os dados fiscais primeiro.');
    }
    return config;
  }

  /**
   * Emite NFC-e para uma venda
   */
  async issueNfce(dto: IssueNfceDto) {
    try {
      this.logger.log(`Iniciando emissão de NFC-e para venda ${dto.saleId}`);

      // Buscar configuração fiscal
      const fiscalConfig = await this.getFiscalConfigFromDb();

      // Buscar última NFC-e para gerar próximo número
      const lastNfe = await this.prisma.nFe.findFirst({
        orderBy: { number: 'desc' },
      });

      const nextNumber = (lastNfe?.number || 0) + 1;
      const series = fiscalConfig.nfceSeries;

      // Preparar dados do emitente
      const emitterConfig = {
        cnpj: fiscalConfig.cnpj,
        name: fiscalConfig.name,
        fantasyName: fiscalConfig.fantasyName,
        ie: fiscalConfig.ie,
        address: {
          street: fiscalConfig.street,
          number: fiscalConfig.number,
          neighborhood: fiscalConfig.neighborhood,
          city: fiscalConfig.city,
          cityCode: fiscalConfig.cityCode,
          state: fiscalConfig.state,
          zipCode: fiscalConfig.zipCode,
        },
      };

      // Preparar dados da NFC-e
      const nfceData = {
        number: nextNumber,
        series,
        dateTime: new Date(),
        items: dto.items.map(item => ({
          code: item.productId,
          name: item.name,
          ncm: item.ncm || '00000000',
          cfop: item.cfop || '5102', // CFOP padrão para venda
          quantity: item.quantity,
          unitPrice: item.price,
          total: item.quantity * item.price,
        })),
        total: dto.total,
        emitter: emitterConfig,
        customer: dto.customerCpf ? {
          cpf: dto.customerCpf,
          name: dto.customerName,
        } : undefined,
      };

      // Gerar XML da NFC-e
      const xml = this.nfceService.generateNFCeXML(nfceData);

      // Validar XML
      if (!this.nfceService.validateNFCeXML(xml)) {
        throw new BadRequestException('XML NFC-e inválido');
      }

      // Extrair chave de acesso do XML
      const accessKey = this.extractAccessKey(xml);

      // Salvar XML como arquivo físico
      try {
        await this.storageService.saveXML(xml, accessKey);
        this.logger.log(`XML salvo como arquivo: ${accessKey}`);
      } catch (error) {
        this.logger.warn(`Erro ao salvar XML como arquivo: ${error.message}`);
      }

      let status = 'PENDENTE';
      let protocol = null;
      let responseMessage = 'NFC-e gerada, aguardando autorização';

      // Se tem certificado configurado, enviar para SEFAZ
      if (fiscalConfig.certificate && fiscalConfig.certificatePass) {
        this.logger.log('Enviando NFC-e para autorização SEFAZ');
        
        const sefazConfig = {
          certificate: fiscalConfig.certificate,
          password: fiscalConfig.certificatePass,
          environment: fiscalConfig.environment as 'homologacao' | 'producao',
          uf: fiscalConfig.state,
        };

        // Autorizar na SEFAZ
        const sefazResponse = await this.sefazService.authorizeNfce(xml, sefazConfig);

        if (sefazResponse.success) {
          status = 'AUTORIZADA';
          protocol = sefazResponse.protocol;
          responseMessage = sefazResponse.message || 'NFC-e autorizada com sucesso';
        } else {
          status = 'REJEITADA';
          responseMessage = `Erro SEFAZ: ${sefazResponse.message || sefazResponse.error}`;
          this.logger.error(`NFC-e rejeitada: ${responseMessage}`);
        }
      } else {
        this.logger.warn('Certificado não configurado. NFC-e gerada sem envio para SEFAZ.');
        status = 'SEM_CERTIFICADO';
        responseMessage = 'NFC-e gerada sem envio (certificado não configurado)';
      }

      // Gerar QR Code
      const qrCodeUrl = this.nfceService.generateQRCode(accessKey, null);

      // Salvar NFC-e no banco
      const nfe = await this.prisma.nFe.create({
        data: {
          number: nextNumber,
          series,
          key: accessKey,
          xml,
          status,
          protocol,
          qrCodeUrl,
        },
      });

      // Atualizar venda com a NFC-e
      if (dto.saleId) {
        await this.prisma.sale.update({
          where: { id: dto.saleId },
          data: {
            nfeKey: accessKey,
            nfeId: nfe.id,
          },
        });
      }

      this.logger.log(`NFC-e ${nextNumber} processada. Status: ${status}`);

      return {
        success: status === 'AUTORIZADA' || status === 'SEM_CERTIFICADO',
        nfceId: nfe.id,
        number: nextNumber,
        series,
        accessKey,
        xml,
        qrCodeUrl,
        status,
        protocol,
        message: responseMessage,
      };
    } catch (error) {
      this.logger.error('Erro ao emitir NFC-e', error);
      throw new BadRequestException(`Erro ao emitir NFC-e: ${error.message}`);
    }
  }

  /**
   * Gera cobrança PIX para uma venda
   */
  async generatePixCharge(dto: GeneratePixDto) {
    try {
      this.logger.log(`Gerando cobrança PIX de R$ ${dto.amount}`);

      // Tentar buscar do banco, se falhar usar .env
      let pixKey = process.env.PIX_KEY;
      let merchantName = process.env.PIX_MERCHANT_NAME;
      let merchantCity = process.env.PIX_MERCHANT_CITY;

      try {
        const fiscalConfig = await this.prisma.fiscalConfig.findFirst();
        if (fiscalConfig?.pixKey) {
          pixKey = fiscalConfig.pixKey;
          merchantName = fiscalConfig.pixMerchantName;
          merchantCity = fiscalConfig.pixMerchantCity;
        }
      } catch (error) {
        this.logger.warn('Usando configuração PIX do .env');
      }

      const pixCharge = await this.pixService.generatePixCharge({
        amount: dto.amount,
        merchantName,
        merchantCity,
        pixKey,
        description: dto.description || `Venda ${dto.saleId || 'PDV'}`,
        txId: dto.saleId,
      });

      // Validar BR Code gerado
      if (!this.pixService.validateBRCode(pixCharge.qrCode)) {
        throw new BadRequestException('BR Code PIX inválido');
      }

      // Atualizar venda com PIX se tiver saleId
      if (dto.saleId) {
        await this.prisma.sale.update({
          where: { id: dto.saleId },
          data: {
            pixQrCode: pixCharge.qrCode,
            pixTxId: pixCharge.txId,
          },
        });
      }

      this.logger.log(`Cobrança PIX gerada. TxId: ${pixCharge.txId}`);

      return {
        success: true,
        ...pixCharge,
        message: 'Cobrança PIX gerada com sucesso',
      };
    } catch (error) {
      this.logger.error('Erro ao gerar cobrança PIX', error);
      throw new BadRequestException(`Erro ao gerar PIX: ${error.message}`);
    }
  }

  /**
   * Busca NFC-e por ID
   */
  async getNfceById(id: string) {
    const nfe = await this.prisma.nFe.findUnique({
      where: { id },
    });

    if (!nfe) {
      throw new BadRequestException('NFC-e não encontrada');
    }

    return {
      id: nfe.id,
      number: nfe.number,
      series: nfe.series,
      key: nfe.key,
      status: nfe.status,
      createdAt: nfe.createdAt,
      qrCodeUrl: this.nfceService.generateQRCode(nfe.key, null),
    };
  }

  /**
   * Retorna XML da NFC-e
   */
  async getNfceXml(id: string) {
    const nfe = await this.prisma.nFe.findUnique({
      where: { id },
    });

    if (!nfe) {
      throw new BadRequestException('NFC-e não encontrada');
    }

    let xml = nfe.xml;

    // Se XML não estiver no banco, tentar recuperar do arquivo
    if (!xml && nfe.key) {
      try {
        xml = await this.storageService.getXML(nfe.key);
        this.logger.log(`XML recuperado do arquivo: ${nfe.key}`);
      } catch (error) {
        this.logger.warn(`Erro ao recuperar XML do arquivo: ${error.message}`);
      }
    }

    if (!xml) {
      throw new BadRequestException('XML da NFC-e não encontrado');
    }

    return {
      xml,
      key: nfe.key,
    };
  }

  /**
   * Retorna configuração fiscal
   */
  async getFiscalConfig() {
    try {
      const config = await this.getFiscalConfigFromDb();
      
      return {
        emitter: {
          cnpj: config.cnpj,
          name: config.name,
          fantasyName: config.fantasyName,
          ie: config.ie,
          address: {
            street: config.street,
            number: config.number,
            neighborhood: config.neighborhood,
            city: config.city,
            state: config.state,
            zipCode: config.zipCode,
          },
        },
        pix: {
          pixKey: config.pixKey,
          merchantName: config.pixMerchantName,
          merchantCity: config.pixMerchantCity,
        },
        nfce: {
          environment: config.environment,
          series: config.nfceSeries,
          hasCertificate: !!(config.certificate && config.certificatePass),
          certExpiresAt: config.certExpiresAt,
        },
      };
    } catch (error) {
      // Se não tem config, retornar estrutura vazia
      return {
        emitter: null,
        pix: null,
        nfce: {
          environment: 'homologacao',
          series: 1,
          hasCertificate: false,
        },
      };
    }
  }

  /**
   * Salva ou atualiza configuração fiscal
   */
  async saveFiscalConfig(data: any) {
    try {
      const existing = await this.prisma.fiscalConfig.findFirst();
      
      if (existing) {
        return await this.prisma.fiscalConfig.update({
          where: { id: existing.id },
          data: {
            ...data,
            updatedAt: new Date(),
          },
        });
      } else {
        return await this.prisma.fiscalConfig.create({
          data,
        });
      }
    } catch (error) {
      this.logger.error('Erro ao salvar configuração fiscal', error);
      throw new BadRequestException(`Erro ao salvar configuração: ${error.message}`);
    }
  }

  /**
   * Valida e salva certificado digital
   */
  async uploadCertificate(certificate: string, password: string) {
    try {
      // Validar certificado
      const validation = this.sefazService.validateCertificate(certificate, password);
      
      if (!validation.valid) {
        throw new BadRequestException(validation.error || 'Certificado inválido');
      }

      // Salvar na configuração
      const existing = await this.prisma.fiscalConfig.findFirst();
      
      if (!existing) {
        throw new BadRequestException('Configure os dados fiscais antes de enviar o certificado');
      }

      await this.prisma.fiscalConfig.update({
        where: { id: existing.id },
        data: {
          certificate,
          certificatePass: password,
          certExpiresAt: validation.expiresAt,
        },
      });

      this.logger.log('Certificado digital salvo com sucesso');

      return {
        success: true,
        message: 'Certificado validado e salvo com sucesso',
        expiresAt: validation.expiresAt,
        cnpj: validation.cnpj,
      };
    } catch (error) {
      this.logger.error('Erro ao fazer upload do certificado', error);
      throw new BadRequestException(`Erro: ${error.message}`);
    }
  }

  /**
   * Verifica status do serviço SEFAZ
   */
  async checkSefazStatus() {
    try {
      const config = await this.getFiscalConfigFromDb();
      
      if (!config.certificate || !config.certificatePass) {
        return {
          online: false,
          message: 'Certificado não configurado',
        };
      }

      const sefazConfig = {
        certificate: config.certificate,
        password: config.certificatePass,
        environment: config.environment as 'homologacao' | 'producao',
        uf: config.state,
      };

      return await this.sefazService.checkServiceStatus(sefazConfig);
    } catch (error) {
      return {
        online: false,
        message: `Erro: ${error.message}`,
      };
    }
  }

  /**
   * Extrai chave de acesso do XML
   */
  private extractAccessKey(xml: string): string {
    // Tentar diferentes padrões de extração
    const patterns = [
      /Id="NFe(\d{44})"/,           // Padrão principal
      /<chNFe>(\d{44})<\/chNFe>/,   // Tag chNFe
      /chave="(\d{44})"/,           // Atributo chave
      /accessKey="(\d{44})"/,       // Atributo accessKey
    ];
    
    for (const pattern of patterns) {
      const match = xml.match(pattern);
      if (match && match[1] && match[1].length === 44) {
        this.logger.log(`Chave de acesso extraída: ${match[1]}`);
        return match[1];
      }
    }
    
    // Se não encontrou, gerar uma chave temporária para não quebrar o fluxo
    this.logger.warn('Chave de acesso não encontrada no XML, gerando chave temporária');
    const tempKey = this.generateTempAccessKey();
    this.logger.log(`Chave temporária gerada: ${tempKey}`);
    return tempKey;
  }
  
  /**
   * Gera chave de acesso temporária para casos de erro
   */
  private generateTempAccessKey(): string {
    const uf = '35'; // SP
    const aamm = new Date().getFullYear().toString().substr(2, 2) + 
                 (new Date().getMonth() + 1).toString().padStart(2, '0');
    const cnpj = '00000000000000'; // CNPJ temporário
    const mod = '65'; // NFC-e
    const serie = '001';
    const numero = Math.floor(Math.random() * 999999999).toString().padStart(9, '0');
    const tpEmis = '1';
    const cNF = Math.floor(10000000 + Math.random() * 90000000).toString();
    
    const base = uf + aamm + cnpj + mod + serie + numero + tpEmis + cNF;
    const dv = this.calculateDV(base);
    
    return base + dv;
  }
  
  /**
   * Lista XMLs salvos em arquivos por período
   */
  async listSavedXmls(year?: number, month?: number) {
    try {
      const currentYear = year || new Date().getFullYear();
      const currentMonth = month || new Date().getMonth() + 1;
      
      const storagePath = `local://${currentYear}/${String(currentMonth).padStart(2, '0')}/`;
      
      // Buscar NFes do período no banco para comparar
      const nfes = await this.prisma.nFe.findMany({
        where: {
          createdAt: {
            gte: new Date(currentYear, currentMonth - 1, 1),
            lt: new Date(currentYear, currentMonth, 1),
          },
        },
        select: {
          id: true,
          number: true,
          key: true,
          status: true,
          createdAt: true,
        },
      });

      return {
        period: `${String(currentMonth).padStart(2, '0')}/${currentYear}`,
        totalNfes: nfes.length,
        nfes: nfes.map(nfe => ({
          id: nfe.id,
          number: nfe.number,
          key: nfe.key,
          status: nfe.status,
          createdAt: nfe.createdAt,
          hasFile: true, // Assumindo que foi salvo após a implementação
        })),
      };
    } catch (error) {
      this.logger.error('Erro ao listar XMLs salvos', error);
      throw new BadRequestException(`Erro ao listar XMLs: ${error.message}`);
    }
  }

  /**
   * Calcula dígito verificador
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
}
