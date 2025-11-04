# 🔧 Guia de Integração dos Novos Serviços

Este guia mostra como integrar os novos serviços criados para produção no código existente.

---

## 1. Configurar Global Exception Filter

**Arquivo:** `backend/src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Adicionar Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Adicionar Validation Pipe para DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();
  
  await app.listen(3001);
}
bootstrap();
```

---

## 2. Integrar Winston Logger

**Arquivo:** `backend/src/main.ts`

Primeiro instale:
```bash
npm install winston nest-winston
```

Depois atualize:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logger/winston.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });

  // ... resto do código
}
bootstrap();
```

---

## 3. Adicionar Health Check ao App Module

**Arquivo:** `backend/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './common/health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
// ... outros imports

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    // ... outros módulos
  ],
  controllers: [
    AppController,
    HealthController, // Adicionar aqui
  ],
  providers: [AppService],
})
export class AppModule {}
```

---

## 4. Integrar Encryption Service no Settings

**Arquivo:** `backend/src/modules/settings/settings.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { EncryptionService } from '../../common/encryption.service';

@Module({
  imports: [PrismaModule],
  controllers: [SettingsController],
  providers: [
    SettingsService,
    EncryptionService, // Adicionar
  ],
})
export class SettingsModule {}
```

**Arquivo:** `backend/src/modules/settings/settings.service.ts`

Atualizar para usar criptografia:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/encryption.service';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService, // Injetar
  ) {}

  async saveFiscalConfig(data: any) {
    // Criptografar senha do certificado antes de salvar
    if (data.certificatePass) {
      data.certificatePass = this.encryption.encryptCertPassword(
        data.certificatePass,
      );
    }

    return this.prisma.fiscalConfig.upsert({
      where: { id: data.id || 'default' },
      update: data,
      create: { ...data, id: 'default' },
    });
  }

  async getFiscalConfig() {
    const config = await this.prisma.fiscalConfig.findFirst();
    
    // Descriptografar senha ao recuperar
    if (config?.certificatePass) {
      try {
        config.certificatePass = this.encryption.decryptCertPassword(
          config.certificatePass,
        );
      } catch (error) {
        console.error('Error decrypting certificate password:', error);
      }
    }

    return config;
  }
}
```

---

## 5. Integrar Storage Service no Fiscal Module

**Arquivo:** `backend/src/modules/fiscal/fiscal.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { FiscalController } from './fiscal.controller';
import { FiscalService } from './fiscal.service';
import { NFCeService } from './nfce.service';
import { SefazService } from './sefaz.service';
import { PixService } from './pix.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageService } from '../../common/storage/storage.service';

@Module({
  imports: [PrismaModule],
  controllers: [FiscalController],
  providers: [
    FiscalService,
    NFCeService,
    SefazService,
    PixService,
    StorageService, // Adicionar
  ],
  exports: [FiscalService, NFCeService, PixService],
})
export class FiscalModule {}
```

**Arquivo:** `backend/src/modules/fiscal/fiscal.service.ts`

Atualizar para salvar XMLs no storage:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NFCeService } from './nfce.service';
import { StorageService } from '../../common/storage/storage.service';

@Injectable()
export class FiscalService {
  private readonly logger = new Logger(FiscalService.name);

  constructor(
    private prisma: PrismaService,
    private nfceService: NFCeService,
    private storage: StorageService, // Injetar
  ) {}

  async issueNFCe(saleId: string) {
    try {
      const sale = await this.prisma.sale.findUnique({
        where: { id: saleId },
        include: {
          items: { include: { product: true } },
          customer: true,
        },
      });

      // Gerar NFCe
      const nfce = await this.nfceService.generate(sale);
      
      // Salvar XML no storage ao invés do banco
      const xmlReference = await this.storage.saveXML(
        nfce.xml,
        nfce.key,
      );

      // Salvar apenas a referência no banco
      const nfe = await this.prisma.nFe.create({
        data: {
          number: nfce.number,
          series: nfce.series,
          key: nfce.key,
          xml: xmlReference, // Referência ao invés do XML
          status: 'AUTHORIZED',
          protocol: nfce.protocol,
          qrCodeUrl: nfce.qrCodeUrl,
        },
      });

      this.logger.log(`NFCe ${nfce.key} saved to storage`);

      return nfe;
    } catch (error) {
      this.logger.error('Error issuing NFCe:', error);
      throw error;
    }
  }

  async getXML(nfeKey: string): Promise<string> {
    const nfe = await this.prisma.nFe.findUnique({
      where: { key: nfeKey },
    });

    if (!nfe) {
      throw new Error('NFe not found');
    }

    // Recuperar XML do storage
    return await this.storage.getXML(nfe.xml);
  }
}
```

---

## 6. Adicionar DTOs com Validação

**Arquivo:** `backend/src/modules/auth/auth.controller.ts`

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
```

Criar DTOs para outros módulos seguindo o mesmo padrão:

**`backend/src/modules/products/dto/create-product.dto.ts`**

```typescript
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsString()
  category?: string;
}
```

---

## 7. Adicionar Rate Limiting

Instalar:
```bash
npm install @nestjs/throttler
```

**Arquivo:** `backend/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60, // 60 segundos
      limit: 100, // 100 requests
    }),
    // ... outros módulos
  ],
})
export class AppModule {}
```

**Proteger rotas específicas:**

```typescript
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    // ...
  }
}
```

---

## 8. Atualizar Schema do Prisma

```bash
cd backend

# Gerar cliente Prisma
npx prisma generate

# Criar migration
npx prisma migrate dev --name add-indexes-and-change-to-postgres

# Aplicar em produção
npx prisma migrate deploy
```

---

## 9. Verificar Integração

Após aplicar as mudanças:

```bash
# Build
npm run build

# Executar
npm run start:prod

# Testar health check
curl http://localhost:3001/health

# Verificar logs
tail -f logs/combined.log
```

---

## 10. Checklist de Integração

- [ ] AllExceptionsFilter adicionado em main.ts
- [ ] Winston logger configurado em main.ts
- [ ] ValidationPipe global configurado
- [ ] HealthController adicionado ao AppModule
- [ ] EncryptionService integrado no SettingsService
- [ ] StorageService integrado no FiscalService
- [ ] DTOs criados e aplicados nos controllers
- [ ] ThrottlerModule configurado
- [ ] Schema Prisma atualizado e migrations executadas
- [ ] Testes realizados
- [ ] Logs verificados

---

**Pronto!** Todos os serviços de produção estão integrados. 🎉
