import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/encryption.service';
import { UpdateSettingsDto, CertificateUploadDto, FileUploadDto } from './dto/settings.dto';
import { Settings, CertificateStatus } from './interfaces/settings.interface';
import { SETTINGS_CONSTANTS } from './constants/settings.constants';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private settingsCache: Settings | null = null;
  private cacheExpiry: number = 0;

  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
  ) {}

  async getSettings() {
    if (this.settingsCache && Date.now() < this.cacheExpiry) {
      return this.settingsCache;
    }

    const settings = await this.getOrCreateSettings();
    const result = this.formatSettings(settings);
    
    this.settingsCache = result;
    this.cacheExpiry = Date.now() + SETTINGS_CONSTANTS.CACHE_TTL;
    
    return result;
  }

  private async getOrCreateSettings() {
    let settings = await this.prisma.fiscalConfig.findFirst();
    
    if (!settings) {
      settings = await this.prisma.fiscalConfig.create({
        data: this.getDefaultSettings(),
      });
      this.logger.log('Configurações padrão criadas');
    }
    
    return settings;
  }

  private getDefaultSettings() {
    return {
      cnpj: '',
      name: 'Empresa',
      fantasyName: 'Empresa',
      ie: '',
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      cityCode: '',
      state: '',
      zipCode: '',
      pixKey: '',
      pixMerchantName: '',
      pixMerchantCity: '',
      environment: 'homologacao',
      nfceSeries: 1,
    };
  }

  private formatSettings(settings: any) {
    const hasCertificate = !!(settings.certificate && settings.certificate.length > 0);
    
    return {
      company: {
        cnpj: settings.cnpj || '',
        name: settings.name || 'Empresa',
        fantasyName: settings.fantasyName || 'Empresa',
        ie: settings.ie || '',
        street: settings.street || '',
        number: settings.number || '',
        neighborhood: settings.neighborhood || '',
        city: settings.city || '',
        cityCode: settings.cityCode || '',
        state: settings.state || '',
        zipCode: settings.zipCode || '',
      },
      fiscal: {
        environment: settings.environment || 'homologacao',
        nfceSeries: settings.nfceSeries || 1,
        hasCertificate: hasCertificate,
        certExpiresAt: settings.certExpiresAt,
      },
      pix: {
        pixKey: settings.pixKey || '',
        pixMerchantName: settings.pixMerchantName || '',
        pixMerchantCity: settings.pixMerchantCity || '',
      },
      customization: {
        logoUrl: null, // Implementar quando necessário
        wallpaperUrl: null,
      },
    };
  }

  async updateSettings(data: UpdateSettingsDto) {
    try {
      this.clearCache();
      
      const existingSettings = await this.prisma.fiscalConfig.findFirst();
      const updateData = this.buildUpdateData(data);

      this.logger.log('Update data:', JSON.stringify(updateData, null, 2));

      if (!existingSettings) {
        const result = await this.prisma.fiscalConfig.create({ data: updateData });
        this.logger.log('Novas configurações criadas');
        return result;
      }

      const result = await this.prisma.fiscalConfig.update({
        where: { id: existingSettings.id },
        data: updateData,
      });
      
      this.logger.log('Configurações atualizadas');
      return result;
    } catch (error) {
      this.logger.error('Erro ao atualizar configurações:', error);
      throw new BadRequestException(`Erro ao salvar configurações: ${error.message}`);
    }
  }

  private buildUpdateData(data: UpdateSettingsDto) {
    const updateData: any = {};
    
    if (data.company) {
      if (data.company.cnpj !== undefined) updateData.cnpj = data.company.cnpj || '';
      if (data.company.name !== undefined) updateData.name = data.company.name || 'Empresa';
      if (data.company.fantasyName !== undefined) updateData.fantasyName = data.company.fantasyName || 'Empresa';
      if (data.company.ie !== undefined) updateData.ie = data.company.ie || '';
      if (data.company.street !== undefined) updateData.street = data.company.street || '';
      if (data.company.number !== undefined) updateData.number = data.company.number || '';
      if (data.company.neighborhood !== undefined) updateData.neighborhood = data.company.neighborhood || '';
      if (data.company.city !== undefined) updateData.city = data.company.city || '';
      if (data.company.cityCode !== undefined) updateData.cityCode = data.company.cityCode || '';
      if (data.company.state !== undefined) updateData.state = data.company.state || '';
      if (data.company.zipCode !== undefined) updateData.zipCode = data.company.zipCode || '';
    }
    
    if (data.pix) {
      if (data.pix.pixKey !== undefined) updateData.pixKey = data.pix.pixKey || '';
      if (data.pix.pixMerchantName !== undefined) updateData.pixMerchantName = data.pix.pixMerchantName || '';
      if (data.pix.pixMerchantCity !== undefined) updateData.pixMerchantCity = data.pix.pixMerchantCity || '';
    }
    
    if (data.fiscal) {
      if (data.fiscal.environment !== undefined) updateData.environment = data.fiscal.environment || 'homologacao';
      if (data.fiscal.nfceSeries !== undefined) updateData.nfceSeries = data.fiscal.nfceSeries || 1;
    }
    
    return updateData;
  }

  async uploadCertificate(data: CertificateUploadDto) {
    try {
      this.clearCache();
      
      const existingSettings = await this.getOrCreateSettings();
      
      if (!data.certificate || !data.password) {
        throw new BadRequestException(
          `${SETTINGS_CONSTANTS.VALIDATION_MESSAGES.CERTIFICATE_REQUIRED} e ${SETTINGS_CONSTANTS.VALIDATION_MESSAGES.PASSWORD_REQUIRED.toLowerCase()}`
        );
      }

      this.logger.log('Processando upload de certificado...');
      
      const encryptedPassword = this.encryption.encryptCertPassword(data.password);
      
      const result = await this.prisma.fiscalConfig.update({
        where: { id: existingSettings.id },
        data: {
          certificate: data.certificate,
          certificatePass: encryptedPassword,
          certExpiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        },
      });
      
      this.logger.log('Certificado salvo com sucesso no banco de dados');
      return { 
        success: true, 
        message: SETTINGS_CONSTANTS.SUCCESS_MESSAGES.CERTIFICATE_UPLOADED,
        hasCertificate: true
      };
    } catch (error) {
      this.logger.error('Erro completo ao processar certificado:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException(
        `Erro ao processar certificado: ${error.message || 'Erro desconhecido'}`
      );
    }
  }

  async uploadLogo(data: FileUploadDto) {
    this.clearCache();
    
    if (!data.fileBase64) {
      throw new BadRequestException(SETTINGS_CONSTANTS.VALIDATION_MESSAGES.FILE_REQUIRED);
    }

    // Em produção, armazenar em serviço de arquivos
    this.logger.log(SETTINGS_CONSTANTS.SUCCESS_MESSAGES.LOGO_UPLOADED);
    return { success: true, logoUrl: '/api/settings/logo' };
  }

  async uploadWallpaper(data: FileUploadDto) {
    if (!data.fileBase64) {
      throw new BadRequestException(SETTINGS_CONSTANTS.VALIDATION_MESSAGES.FILE_REQUIRED);
    }

    this.logger.log(SETTINGS_CONSTANTS.SUCCESS_MESSAGES.WALLPAPER_UPLOADED);
    return { success: true, wallpaperUrl: '/api/settings/wallpaper' };
  }

  async getCertificateStatus() {
    const settings = await this.getOrCreateSettings();
    
    return {
      hasCertificate: !!settings.certificate,
      expiresAt: settings.certExpiresAt,
      isExpired: settings.certExpiresAt ? new Date() > settings.certExpiresAt : false,
    };
  }

  private clearCache() {
    this.settingsCache = null;
    this.cacheExpiry = 0;
  }
}
