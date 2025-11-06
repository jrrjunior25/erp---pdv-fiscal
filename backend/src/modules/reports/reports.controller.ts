import { Controller, Post, Get, Body, Query, Res, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { ReportOptions } from './interfaces/reports.interface';
import { REPORTS_CONSTANTS } from './constants/reports.constants';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('sales')
  async generateSalesReport(@Body() options: ReportOptions, @Res() res: Response) {
    try {
      const report = await this.reportsService.generateSalesReport(options);
      
      if (options.format === 'PDF') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio-vendas-${new Date().toISOString().split('T')[0]}.pdf"`);
        res.end(report);
      } else if (options.format === 'CSV') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio-vendas-${new Date().toISOString().split('T')[0]}.csv"`);
        res.end(report);
      } else {
        res.json(report);
      }
    } catch (error) {
      throw new HttpException(REPORTS_CONSTANTS.ERROR_MESSAGES.GENERATION_ERROR, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('sales/print')
  async printSalesReport(@Body() options: ReportOptions & { printerName?: string }) {
    try {
      const reportBuffer = await this.reportsService.generateSalesReport({
        ...options,
        format: 'PDF'
      }) as Buffer;
      
      await this.reportsService.printReport(reportBuffer, options.printerName);
      
      return {
        success: true,
        message: REPORTS_CONSTANTS.SUCCESS_MESSAGES.REPORT_PRINTED,
      };
    } catch (error) {
      throw new HttpException(REPORTS_CONSTANTS.ERROR_MESSAGES.PRINT_ERROR, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('sales/preview')
  async previewSalesReport(@Query() query: any) {
    try {
      const options: ReportOptions = {
        type: 'SALES',
        format: 'PDF',
        filters: {
          startDate: new Date(query.startDate),
          endDate: new Date(query.endDate),
          sellerId: query.sellerId,
          customerId: query.customerId,
          paymentMethod: query.paymentMethod,
        },
      };

      return await this.reportsService.generateSalesReport(options);
    } catch (error) {
      throw new HttpException(REPORTS_CONSTANTS.ERROR_MESSAGES.GENERATION_ERROR, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('sales')
  async getSalesReport(@Query('start') start: string, @Query('end') end: string) {
    const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = end ? new Date(end) : new Date();
    
    return this.reportsService.getSalesData(startDate, endDate);
  }

  @Get('financial')
  async getFinancialReport(@Query('start') start: string, @Query('end') end: string) {
    const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = end ? new Date(end) : new Date();
    
    return this.reportsService.getFinancialData(startDate, endDate);
  }

  @Get('inventory')
  async getInventoryReport() {
    return this.reportsService.getInventoryData();
  }

  @Get('periods')
  getPredefinedPeriods() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);
    
    const monthStart = new Date(today);
    monthStart.setMonth(today.getMonth() - 1);

    return {
      TODAY: {
        startDate: new Date(today.setHours(0, 0, 0, 0)),
        endDate: new Date(today.setHours(23, 59, 59, 999)),
      },
      YESTERDAY: {
        startDate: new Date(yesterday.setHours(0, 0, 0, 0)),
        endDate: new Date(yesterday.setHours(23, 59, 59, 999)),
      },
      WEEK: {
        startDate: weekStart,
        endDate: today,
      },
      MONTH: {
        startDate: monthStart,
        endDate: today,
      },
    };
  }
}