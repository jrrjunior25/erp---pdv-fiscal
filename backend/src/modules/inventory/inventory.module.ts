import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { StockMovementService } from './services/stock-movement.service';
import { InventoryAlertsService } from './services/inventory-alerts.service';
import { InventoryExcelService } from './services/inventory-excel.service';
import { InventoryReportService } from './services/inventory-report.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    StockMovementService,
    InventoryAlertsService,
    InventoryExcelService,
    InventoryReportService
  ],
  exports: [
    InventoryService,
    StockMovementService,
    InventoryAlertsService,
    InventoryReportService
  ],
})
export class InventoryModule {}
