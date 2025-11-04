import { IsNotEmpty, IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class GeneratePixDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  saleId?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
