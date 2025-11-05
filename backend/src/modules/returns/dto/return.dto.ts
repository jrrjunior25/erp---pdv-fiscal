import { IsString, IsArray, ValidateNested, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class ReturnItemDto {
  @IsString()
  productId: string;

  @IsString()
  quantity: number;
}

export class CreateReturnDto {
  @IsString()
  saleId: string;

  @IsEnum(['DEFECTIVE', 'WRONG_ITEM', 'CUSTOMER_CHANGE', 'DAMAGED', 'OTHER'])
  reason: 'DEFECTIVE' | 'WRONG_ITEM' | 'CUSTOMER_CHANGE' | 'DAMAGED' | 'OTHER';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[];
}

export class UpdateReturnDto {
  @IsEnum(['PENDING', 'APPROVED', 'REJECTED', 'PROCESSED'])
  @IsOptional()
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
}