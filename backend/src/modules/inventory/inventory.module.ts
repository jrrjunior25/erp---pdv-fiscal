import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { StockMovementService } from './services/stock-movement.service';
import { InventoryAlertsService } from './services/inventory-alerts.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    StockMovementService,
    InventoryAlertsService
  ],
  exports: [
    InventoryService,
    StockMovementService,
    InventoryAlertsService
  ],
})
export class InventoryModule {}
