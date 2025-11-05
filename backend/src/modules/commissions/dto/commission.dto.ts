import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';

export class CreateCommissionDto {
  @IsString()
  saleId: string;

  @IsString()
  sellerId: string;

  @IsNumber()
  @IsOptional()
  rate?: number;
}

export class UpdateCommissionDto {
  @IsEnum(['PENDING', 'PAID', 'CANCELLED'])
  @IsOptional()
  status?: 'PENDING' | 'PAID' | 'CANCELLED';
}

export class PayCommissionDto {
  @IsString()
  commissionId: string;
}