import { IsString, IsNumber, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class PurchaseItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;
}

export class CreatePurchaseOrderDto {
  @IsString()
  supplierId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];
}

export class UpdatePurchaseOrderDto {
  @IsString()
  @IsOptional()
  status?: 'PENDING' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';
}