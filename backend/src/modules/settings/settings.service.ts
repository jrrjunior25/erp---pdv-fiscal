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
      name: '',
      fantasyName: '',
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
      environment: SETTINGS_CONSTANTS.DEFAULT_ENVIRONMENT,
      nfceSeries: SETTINGS_CONSTANTS.DEFAULT_NFCE_SERIES,
    };
  }

  private formatSettings(settings: any) {
    return {
      company: {
        cnpj: settings.cnpj,
        name: settings.name,
        fantasyName: settings.fantasyName,
        ie: settings.ie,
        street: settings.street,
        number: settings.number,
        neighborhood: settings.neighborhood,
        city: settings.city,
        cityCode: settings.cityCode,
        state: settings.state,
        zipCode: settings.zipCode,
      },
      fiscal: {
        environment: settings.environment,
        nfceSeries: settings.nfceSeries,
        hasCertificate: !!settings.certificate,
        certExpiresAt: settings.certExpiresAt,
      },
      pix: {
        pixKey: settings.pixKey,
        pixMerchantName: settings.pixMerchantName,
        pixMerchantCity: settings.pixMerchantCity,
      },
      customization: {
        logoUrl: settings.certificate ? '/api/settings/logo' : null,
        wallpaperUrl: null,
      },
    };
  }

  async updateSettings(data: UpdateSettingsDto) {
    this.clearCache();
    
    const existingSettings = await this.prisma.fiscalConfig.findFirst();
    const updateData = this.buildUpdateData(data);

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
  }

  private buildUpdateData(data: UpdateSettingsDto) {
    return {
      ...(data.company?.cnpj !== undefined && { cnpj: data.company.cnpj }),
      ...(data.company?.name !== undefined && { name: data.company.name }),
      ...(data.company?.fantasyName !== undefined && { fantasyName: data.company.fantasyName }),
      ...(data.company?.ie !== undefined && { ie: data.company.ie }),
      ...(data.company?.street !== undefined && { street: data.company.street }),
      ...(data.company?.number !== undefined && { number: data.company.number }),
      ...(data.company?.neighborhood !== undefined && { neighborhood: data.company.neighborhood }),
      ...(data.company?.city !== undefined && { city: data.company.city }),
      ...(data.company?.cityCode !== undefined && { cityCode: data.company.cityCode }),
      ...(data.company?.state !== undefined && { state: data.company.state }),
      ...(data.company?.zipCode !== undefined && { zipCode: data.company.zipCode }),
      ...(data.pix?.pixKey !== undefined && { pixKey: data.pix.pixKey }),
      ...(data.pix?.pixMerchantName !== undefined && { pixMerchantName: data.pix.pixMerchantName }),
      ...(data.pix?.pixMerchantCity !== undefined && { pixMerchantCity: data.pix.pixMerchantCity }),
      ...(data.fiscal?.environment !== undefined && { environment: data.fiscal.environment }),
      ...(data.fiscal?.nfceSeries !== undefined && { nfceSeries: data.fiscal.nfceSeries }),
    };
  }

  async uploadCertificate(data: CertificateUploadDto) {
    this.clearCache();
    
    const existingSettings = await this.getOrCreateSettings();
    
    if (!data.certificate || !data.password) {
      throw new BadRequestException(
        `${SETTINGS_CONSTANTS.VALIDATION_MESSAGES.CERTIFICATE_REQUIRED} e ${SETTINGS_CONSTANTS.VALIDATION_MESSAGES.PASSWORD_REQUIRED.toLowerCase()}`
      );
    }

    try {
      const encryptedPassword = this.encryption.encryptCertPassword(data.password);
      
      const result = await this.prisma.fiscalConfig.update({
        where: { id: existingSettings.id },
        data: {
          certificate: data.certificate,
          certificatePass: encryptedPassword,
          certExpiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        },
      });
      
      this.logger.log('Certificado atualizado com sucesso');
      return { success: true, message: SETTINGS_CONSTANTS.SUCCESS_MESSAGES.CERTIFICATE_UPLOADED };
    } catch (error) {
      this.logger.error('Erro ao criptografar senha do certificado:', error);
      throw new BadRequestException(SETTINGS_CONSTANTS.ERROR_MESSAGES.CERTIFICATE_ENCRYPTION_ERROR);
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
