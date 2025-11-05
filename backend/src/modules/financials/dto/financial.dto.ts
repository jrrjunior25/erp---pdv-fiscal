import { IsString, IsNumber, IsEnum, IsOptional, IsDateString } from 'class-validator';

export class CreateFinancialTransactionDto {
  @IsEnum(['INCOME', 'EXPENSE'])
  type: 'INCOME' | 'EXPENSE';

  @IsNumber()
  amount: number;

  @IsString()
  description: string;

  @IsString()
  category: string;

  @IsDateString()
  @IsOptional()
  date?: string;
}

export class UpdateFinancialTransactionDto {
  @IsEnum(['INCOME', 'EXPENSE'])
  @IsOptional()
  type?: 'INCOME' | 'EXPENSE';

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsDateString()
  @IsOptional()
  date?: string;
}