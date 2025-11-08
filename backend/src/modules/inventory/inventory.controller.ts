import { Controller, Get, Post, Body, UseGuards, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InventoryService } from './inventory.service';
import { InventoryExcelService } from './services/inventory-excel.service';
import { InventoryReportService } from './services/inventory-report.service';
import { UpdateStockDto, InventoryCountDto, StockTransferDto, InventoryFiltersDto } from './dto/inventory.dto';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly excelService: InventoryExcelService,
    private readonly reportService: InventoryReportService,
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
    try {
      const buffer = await this.excelService.exportToExcel();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=estoque_${new Date().toISOString().split('T')[0]}.xlsx`);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'no-cache');
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao exportar estoque', error: error.message });
    }
  }

  @Get('export/template')
  async exportTemplate(@Res() res: Response) {
    try {
      const buffer = await this.excelService.exportTemplate();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=modelo_estoque.xlsx');
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'no-cache');
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao exportar template', error: error.message });
    }
  }

  @Post('import-nfe')
  importNfe(@Body() data: any) {
    return this.inventoryService.importNfe(data);
  }

  @Get('reports/stock/pdf')
  async getStockReportPDF(@Query() filters: any, @Res() res: Response) {
    try {
      const buffer = await this.reportService.generateStockReportPDF(filters);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio_estoque_${new Date().toISOString().split('T')[0]}.pdf`);
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao gerar relatório PDF', error: error.message });
    }
  }

  @Get('reports/stock/excel')
  async getStockReportExcel(@Query() filters: any, @Res() res: Response) {
    try {
      const buffer = await this.reportService.generateStockReportExcel(filters);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio_estoque_${new Date().toISOString().split('T')[0]}.xlsx`);
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao gerar relatório Excel', error: error.message });
    }
  }

  @Get('reports/low-stock/pdf')
  async getLowStockReportPDF(@Res() res: Response) {
    try {
      const buffer = await this.reportService.generateLowStockReportPDF();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=estoque_baixo_${new Date().toISOString().split('T')[0]}.pdf`);
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao gerar relatório', error: error.message });
    }
  }

  @Get('reports/audit/pdf')
  async getAuditReportPDF(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Res() res: Response) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const buffer = await this.reportService.generateAuditReportPDF(start, end);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=auditoria_estoque_${new Date().toISOString().split('T')[0]}.pdf`);
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao gerar relatório de auditoria', error: error.message });
    }
  }

  @Get('analytics')
  async getAnalytics(@Query('period') period: string) {
    return this.inventoryService.getAnalytics(period || '30d');
  }

  @Get('by-category')
  async getByCategory() {
    return this.inventoryService.getStockByCategory();
  }

  @Get('by-supplier')
  async getBySupplier() {
    return this.inventoryService.getStockBySupplier();
  }
}
