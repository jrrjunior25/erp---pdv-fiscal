import { IsNotEmpty, IsString, IsNumber, IsArray, IsOptional, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

class NFEItemDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  ncm: string;

  @IsNotEmpty()
  @IsString()
  cfop: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  cstIcms?: string;

  @IsOptional()
  @IsString()
  cstPis?: string;

  @IsOptional()
  @IsString()
  cstCofins?: string;

  @IsOptional()
  @IsNumber()
  aliqIcms?: number;

  @IsOptional()
  @IsNumber()
  aliqPis?: number;

  @IsOptional()
  @IsNumber()
  aliqCofins?: number;

  @IsOptional()
  @IsString()
  origem?: string;
}

class NFERecipientDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  cnpj?: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsString()
  ie?: string;

  @IsNotEmpty()
  @IsString()
  street: string;

  @IsNotEmpty()
  @IsString()
  number: string;

  @IsNotEmpty()
  @IsString()
  neighborhood: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  cityCode: string;

  @IsNotEmpty()
  @IsString()
  state: string;

  @IsNotEmpty()
  @IsString()
  zipCode: string;
}

class NFETransportDto {
  @IsNotEmpty()
  @IsString()
  modality: string; // 0-Emitente, 1-Destinatário, 2-Terceiros, 9-Sem frete

  @IsOptional()
  @IsString()
  carrierCnpj?: string;

  @IsOptional()
  @IsString()
  carrierName?: string;

  @IsOptional()
  @IsString()
  carrierIe?: string;
}

class NFEInstallmentDto {
  @IsNotEmpty()
  @IsNumber()
  number: number;

  @IsNotEmpty()
  @IsDateString()
  dueDate: string;

  @IsNotEmpty()
  @IsNumber()
  value: number;
}

class NFEPaymentDto {
  @IsNotEmpty()
  @IsString()
  method: string; // DINHEIRO, CARTAO_CREDITO, CARTAO_DEBITO, PIX, etc.

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NFEInstallmentDto)
  installments?: NFEInstallmentDto[];
}

export class IssueNfeDto {
  @IsOptional()
  @IsString()
  saleId?: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NFEItemDto)
  items: NFEItemDto[];

  @IsNotEmpty()
  @IsNumber()
  total: number;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => NFERecipientDto)
  recipient: NFERecipientDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NFETransportDto)
  transport?: NFETransportDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => NFEPaymentDto)
  payment: NFEPaymentDto;

  @IsOptional()
  @IsString()
  observations?: string;
}