import { IsString, IsEmail, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsEnum(['ADMIN', 'MANAGER', 'SELLER', 'CASHIER'])
  role: 'ADMIN' | 'MANAGER' | 'SELLER' | 'CASHIER';

  @IsBoolean()
  @IsOptional()
  active?: boolean = true;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsEnum(['ADMIN', 'MANAGER', 'SELLER', 'CASHIER'])
  @IsOptional()
  role?: 'ADMIN' | 'MANAGER' | 'SELLER' | 'CASHIER';

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}