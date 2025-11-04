import { IsNotEmpty, IsArray, IsNumber, IsString, IsOptional } from 'class-validator';

export class IssueNfceDto {
  @IsNotEmpty()
  @IsString()
  saleId: string;

  @IsNotEmpty()
  @IsArray()
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    ncm?: string;
    cfop?: string;
  }>;

  @IsNotEmpty()
  @IsNumber()
  total: number;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  customerCpf?: string;

  @IsOptional()
  @IsString()
  customerName?: string;
}
