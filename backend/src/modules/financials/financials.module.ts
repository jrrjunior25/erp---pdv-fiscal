import { Module } from '@nestjs/common';
import { FinancialsController } from './financials.controller';
import { FinancialsService } from './financials.service';
import { FinancialExcelService } from './services/financial-excel.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FinancialsController],
  providers: [FinancialsService, FinancialExcelService],
  exports: [FinancialsService],
})
export class FinancialsModule {}
