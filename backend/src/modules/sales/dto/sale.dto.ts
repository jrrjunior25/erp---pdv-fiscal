import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateSaleDto {
  @IsOptional()
  @IsNumber()
  number?: number;

  @IsString()
  customerId: string;

  @IsString()
  shiftId: string;

  @IsOptional()
  @IsNumber()
  total?: number;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  nfeKey?: string;

}

export class UpdateSaleDto {
  @IsOptional()
  @IsNumber()
  number?: number;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  shiftId?: string;

  @IsOptional()
  @IsNumber()
  total?: number;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  nfeKey?: string;

}
