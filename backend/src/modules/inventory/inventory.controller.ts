import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InventoryService } from './inventory.service';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('levels')
  getLevels() {
    return this.inventoryService.getLevels();
  }

  @Get('movements')
  getMovements() {
    return this.inventoryService.getMovements();
  }

  @Post('count')
  inventoryCount(@Body() data: { counts: any[] }) {
    return this.inventoryService.inventoryCount(data.counts);
  }

  @Post('parse-nfe')
  parseNfe(@Body() data: any) {
    return this.inventoryService.parseNfe(data);
  }

  @Post('confirm-nfe')
  confirmNfe(@Body() data: any) {
    return this.inventoryService.confirmNfe(data);
  }

  @Post('import-nfe')
  importNfe(@Body() data: any) {
    return this.inventoryService.importNfe(data);
  }
}
