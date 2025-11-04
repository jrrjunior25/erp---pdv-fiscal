import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max, Matches, Length } from 'class-validator';

export class CreateProductDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  barcode?: string; // GTIN/EAN

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  unit?: string; // UN, KG, LT, etc

  // Campos Fiscais
  @IsOptional()
  @IsString()
  ncm?: string;

  @IsOptional()
  @IsString()
  cest?: string;

  @IsOptional()
  @IsString()
  cfop?: string;

  @IsOptional()
  @IsString()
  cstIcms?: string;

  @IsOptional()
  @IsString()
  cstPis?: string;

  @IsOptional()
  @IsString()
  cstCofins?: string;

  @IsOptional()
  @IsString()
  origem?: string;

  // Alíquotas
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  aliqIcms?: number; // %

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  aliqPis?: number; // %

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  aliqCofins?: number; // %

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  // Campos Fiscais
  @IsOptional()
  @IsString()
  ncm?: string;

  @IsOptional()
  @IsString()
  cest?: string;

  @IsOptional()
  @IsString()
  cfop?: string;

  @IsOptional()
  @IsString()
  cstIcms?: string;

  @IsOptional()
  @IsString()
  cstPis?: string;

  @IsOptional()
  @IsString()
  cstCofins?: string;

  @IsOptional()
  @IsString()
  origem?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  aliqIcms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  aliqPis?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  aliqCofins?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
