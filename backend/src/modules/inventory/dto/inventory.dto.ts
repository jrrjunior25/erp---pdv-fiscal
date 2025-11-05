import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';

export class UpdateStockDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsEnum(['IN', 'OUT', 'ADJUSTMENT'])
  type: 'IN' | 'OUT' | 'ADJUSTMENT';

  @IsString()
  reason: string;

  @IsString()
  @IsOptional()
  location?: string;
}

export class SetStockLevelsDto {
  @IsString()
  productId: string;

  @IsNumber()
  @IsOptional()
  minStock?: number;

  @IsNumber()
  @IsOptional()
  maxStock?: number;

  @IsString()
  @IsOptional()
  location?: string;
}