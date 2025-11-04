import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateShiftDto {
  @IsOptional()
  @IsNumber()
  number?: number;

  @IsString()
  userId: string;

  @IsOptional()
  @IsNumber()
  openingCash?: number;

  @IsOptional()
  @IsNumber()
  closingCash?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  openedAt?: string;

  @IsOptional()
  @IsString()
  closedAt?: string;

}

export class UpdateShiftDto {
  @IsOptional()
  @IsNumber()
  number?: number;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsNumber()
  openingCash?: number;

  @IsOptional()
  @IsNumber()
  closingCash?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  openedAt?: string;

  @IsOptional()
  @IsString()
  closedAt?: string;

}
