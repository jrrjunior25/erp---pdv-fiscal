import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { GeminiModule } from './modules/gemini/gemini.module';
import { ProductsModule } from './modules/products/products.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { SalesModule } from './modules/sales/sales.module';
import { ShiftsModule } from './modules/shifts/shifts.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { FinancialsModule } from './modules/financials/financials.module';
import { PurchasingModule } from './modules/purchasing/purchasing.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { FiscalModule } from './modules/fiscal/fiscal.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { CommissionsModule } from './modules/commissions/commissions.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ReportsModule } from './modules/reports/reports.module';
import { BackupModule } from './modules/backup/backup.module';
import { AppController } from './app.controller';
import { HealthController } from './common/health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    GeminiModule,
    ProductsModule,
    CustomersModule,
    SuppliersModule,
    SalesModule,
    ShiftsModule,
    InventoryModule,
    FinancialsModule,
    PurchasingModule,
    AnalyticsModule,
    FiscalModule,
    ReturnsModule,
    CommissionsModule,
    QuotationsModule,
    SettingsModule,
    ReportsModule,
    BackupModule,
  ],
  controllers: [AppController, HealthController],
  providers: [],
})
export class AppModule {}
