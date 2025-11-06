import { IsNotEmpty, IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class GeneratePixDto {
  @IsNotEmpty({ message: 'Valor é obrigatório' })
  @IsNumber({}, { message: 'Valor deve ser um número' })
  @Min(0.01, { message: 'Valor mínimo é R$ 0,01' })
  @Max(999999.99, { message: 'Valor máximo é R$ 999.999,99' })
  @Transform(({ value }) => parseFloat(value))
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

  @IsOptional()
  @IsString()
  merchantName?: string;

  @IsOptional()
  @IsString()
  merchantCity?: string;

  @IsOptional()
  @IsString()
  pixKey?: string;
}
