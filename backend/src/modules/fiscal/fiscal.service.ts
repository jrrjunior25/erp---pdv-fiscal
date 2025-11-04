import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NfceService } from './nfce.service';
import { PixService } from './pix.service';
import { SefazService } from './sefaz.service';
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

      // Buscar configuração fiscal
      const fiscalConfig = await this.getFiscalConfigFromDb();

      // Log dos dados PIX
      this.logger.log(`Dados PIX encontrados: ${JSON.stringify({
        pixKey: fiscalConfig.pixKey,
        merchantName: fiscalConfig.pixMerchantName,
        merchantCity: fiscalConfig.pixMerchantCity,
      })}`);

      // Validar se tem dados PIX
      if (!fiscalConfig.pixKey || !fiscalConfig.pixMerchantName || !fiscalConfig.pixMerchantCity) {
        throw new BadRequestException('Configuração PIX incompleta. Por favor, configure os dados PIX nas configurações do sistema.');
      }

      const pixCharge = await this.pixService.generatePixCharge({
        amount: dto.amount,
        merchantName: fiscalConfig.pixMerchantName,
        merchantCity: fiscalConfig.pixMerchantCity,
        pixKey: fiscalConfig.pixKey,
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

    return {
      xml: nfe.xml,
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
    const match = xml.match(/Id="NFe(\d{44})"/);
    if (!match) {
      throw new BadRequestException('Chave de acesso não encontrada no XML');
    }
    return match[1];
  }
}
