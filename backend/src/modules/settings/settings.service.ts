import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/encryption.service';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
  ) {}

  async getSettings() {
    // Try to get existing settings
    let settings = await this.prisma.fiscalConfig.findFirst();

    // If no settings exist, create default ones
    if (!settings) {
      settings = await this.prisma.fiscalConfig.create({
        data: {
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
          environment: 'homologacao',
          nfceSeries: 1,
        },
      });
    }

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
        wallpaperUrl: null, // Can be extended later
      },
    };
  }

  async updateSettings(data: any) {
    const existingSettings = await this.prisma.fiscalConfig.findFirst();

    if (!existingSettings) {
      return this.prisma.fiscalConfig.create({
        data: {
          cnpj: data.company?.cnpj || '',
          name: data.company?.name || '',
          fantasyName: data.company?.fantasyName || '',
          ie: data.company?.ie || '',
          street: data.company?.street || '',
          number: data.company?.number || '',
          neighborhood: data.company?.neighborhood || '',
          city: data.company?.city || '',
          cityCode: data.company?.cityCode || '',
          state: data.company?.state || '',
          zipCode: data.company?.zipCode || '',
          pixKey: data.pix?.pixKey || '',
          pixMerchantName: data.pix?.pixMerchantName || '',
          pixMerchantCity: data.pix?.pixMerchantCity || '',
          environment: data.fiscal?.environment || 'homologacao',
          nfceSeries: data.fiscal?.nfceSeries || 1,
        },
      });
    }

    return this.prisma.fiscalConfig.update({
      where: { id: existingSettings.id },
      data: {
        cnpj: data.company?.cnpj,
        name: data.company?.name,
        fantasyName: data.company?.fantasyName,
        ie: data.company?.ie,
        street: data.company?.street,
        number: data.company?.number,
        neighborhood: data.company?.neighborhood,
        city: data.company?.city,
        cityCode: data.company?.cityCode,
        state: data.company?.state,
        zipCode: data.company?.zipCode,
        pixKey: data.pix?.pixKey,
        pixMerchantName: data.pix?.pixMerchantName,
        pixMerchantCity: data.pix?.pixMerchantCity,
        environment: data.fiscal?.environment,
        nfceSeries: data.fiscal?.nfceSeries,
      },
    });
  }

  async uploadCertificate(data: any) {
    const existingSettings = await this.prisma.fiscalConfig.findFirst();

    if (!existingSettings) {
      throw new Error('Settings not found. Please create settings first.');
    }

    // Encrypt certificate password before storing
    let encryptedPassword = data.password;
    if (data.password) {
      try {
        encryptedPassword = this.encryption.encryptCertPassword(data.password);
        this.logger.log('Certificate password encrypted successfully');
      } catch (error) {
        this.logger.error('Error encrypting certificate password:', error);
        throw new Error('Failed to encrypt certificate password');
      }
    }

    return this.prisma.fiscalConfig.update({
      where: { id: existingSettings.id },
      data: {
        certificate: data.certificate,
        certificatePass: encryptedPassword,
        certExpiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });
  }

  async uploadLogo(data: any) {
    const existingSettings = await this.prisma.fiscalConfig.findFirst();

    if (!existingSettings) {
      throw new Error('Settings not found. Please create settings first.');
    }

    // Store logo as base64 in certificate field temporarily
    // In production, you should store this in a file storage service
    return this.prisma.fiscalConfig.update({
      where: { id: existingSettings.id },
      data: {
        certificate: data.logoBase64,
      },
    });
  }

  async uploadWallpaper(data: any) {
    // For now, just return success
    // In production, store in file storage or database
    return { success: true, wallpaperUrl: data.wallpaperBase64 };
  }
}
