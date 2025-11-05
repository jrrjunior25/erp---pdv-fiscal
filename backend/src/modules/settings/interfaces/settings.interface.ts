export interface CompanySettings {
  cnpj: string;
  name: string;
  fantasyName: string;
  ie: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  cityCode: string;
  state: string;
  zipCode: string;
}

export interface FiscalSettings {
  environment: 'homologacao' | 'producao';
  nfceSeries: number;
  hasCertificate: boolean;
  certExpiresAt?: Date;
}

export interface PixSettings {
  pixKey: string;
  pixMerchantName: string;
  pixMerchantCity: string;
}

export interface CustomizationSettings {
  logoUrl?: string;
  wallpaperUrl?: string;
}

export interface Settings {
  company: CompanySettings;
  fiscal: FiscalSettings;
  pix: PixSettings;
  customization: CustomizationSettings;
}

export interface CertificateStatus {
  hasCertificate: boolean;
  expiresAt?: Date;
  isExpired: boolean;
}