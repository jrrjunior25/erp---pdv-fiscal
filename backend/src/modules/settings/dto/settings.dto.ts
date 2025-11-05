import { IsString, IsOptional, IsEnum, IsNumber, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CompanySettingsDto {
  @IsString()
  @IsOptional()
  cnpj?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  fantasyName?: string;

  @IsString()
  @IsOptional()
  ie?: string;

  @IsString()
  @IsOptional()
  street?: string;

  @IsString()
  @IsOptional()
  number?: string;

  @IsString()
  @IsOptional()
  neighborhood?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  cityCode?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  zipCode?: string;
}

export class FiscalSettingsDto {
  @IsEnum(['homologacao', 'producao'])
  @IsOptional()
  environment?: 'homologacao' | 'producao';

  @IsNumber()
  @IsOptional()
  nfceSeries?: number;
}

export class PixSettingsDto {
  @IsString()
  @IsOptional()
  pixKey?: string;

  @IsString()
  @IsOptional()
  pixMerchantName?: string;

  @IsString()
  @IsOptional()
  pixMerchantCity?: string;
}

export class UpdateSettingsDto {
  @ValidateNested()
  @Type(() => CompanySettingsDto)
  @IsOptional()
  company?: CompanySettingsDto;

  @ValidateNested()
  @Type(() => FiscalSettingsDto)
  @IsOptional()
  fiscal?: FiscalSettingsDto;

  @ValidateNested()
  @Type(() => PixSettingsDto)
  @IsOptional()
  pix?: PixSettingsDto;
}

export class CertificateUploadDto {
  @IsString()
  certificate: string;

  @IsString()
  password: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

export class FileUploadDto {
  @IsString()
  fileBase64: string;

  @IsString()
  @IsOptional()
  fileName?: string;
}