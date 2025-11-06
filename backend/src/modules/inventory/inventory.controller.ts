import { Controller, Get, Post, Body, UseGuards, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InventoryService } from './inventory.service';
import { InventoryExcelService } from './services/inventory-excel.service';
import { UpdateStockDto, InventoryCountDto, StockTransferDto, InventoryFiltersDto } from './dto/inventory.dto';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly excelService: InventoryExcelService,
  ) {}

  @Get('levels')
  getLevels(@Query() filters: InventoryFiltersDto) {
    return this.inventoryService.getLevels(filters);
  }

  @Get('movements')
  getMovements(@Query() filters: InventoryFiltersDto) {
    return this.inventoryService.getMovements(filters);
  }

  @Get('alerts')
  getAlerts() {
    return this.inventoryService.getAlerts();
  }

  @Get('low-stock')
  getLowStock() {
    return this.inventoryService.getLowStockProducts();
  }

  @Get('report')
  getReport() {
    return this.inventoryService.getInventoryReport();
  }

  @Get('valuation')
  getValuation() {
    return this.inventoryService.getStockValuation();
  }

  @Post('update-stock')
  updateStock(@Body() data: UpdateStockDto, @Req() req: any) {
    return this.inventoryService.updateStock(data, req.user.id);
  }

  @Post('transfer')
  transferStock(@Body() data: StockTransferDto, @Req() req: any) {
    return this.inventoryService.transferStock(data, req.user.id);
  }

  @Post('count')
  inventoryCount(@Body() data: InventoryCountDto, @Req() req: any) {
    return this.inventoryService.inventoryCount(data, req.user.id);
  }

  @Post('parse-nfe')
  parseNfe(@Body() data: any) {
    return this.inventoryService.parseNfe(data);
  }

  @Post('confirm-nfe')
  confirmNfe(@Body() data: any) {
    return this.inventoryService.confirmNfe(data);
  }

  @Get('export/excel')
  async exportExcel(@Res() res: Response) {
    const buffer = await this.excelService.exportToExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="estoque_${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.end(buffer);
  }

  @Get('export/template')
  async exportTemplate(@Res() res: Response) {
    const buffer = await this.excelService.exportTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="modelo_estoque.xlsx"');
    res.end(buffer);
  }

  @Post('import-nfe')
  importNfe(@Body() data: any) {
    return this.inventoryService.importNfe(data);
  }
}
