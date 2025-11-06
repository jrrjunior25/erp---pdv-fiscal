import { IsString, IsNumber, IsEnum, IsOptional, IsArray, ValidateNested, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateStockDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsEnum(['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER'])
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';

  @IsString()
  reason: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  location?: string;
}

export class SetStockLevelsDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minStock?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxStock?: number;

  @IsString()
  @IsOptional()
  location?: string;
}

export class InventoryCountItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(0)
  counted: number;

  @IsString()
  @IsOptional()
  location?: string;
}

export class InventoryCountDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryCountItemDto)
  items: InventoryCountItemDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}

export class StockTransferDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  fromLocation: string;

  @IsString()
  toLocation: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class InventoryFiltersDto {
  @IsString()
  @IsOptional()
  productId?: string;

  @IsBoolean()
  @IsOptional()
  lowStock?: boolean;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsOptional()
  dateFrom?: Date;

  @IsOptional()
  dateTo?: Date;
}