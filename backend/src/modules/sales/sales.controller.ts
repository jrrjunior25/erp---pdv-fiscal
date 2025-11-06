import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpException, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SalesService } from './sales.service';
import { SalesExcelService } from './services/sales-excel.service';
import { CreateSaleDto, UpdateSaleDto } from './dto/sale.dto';
import { SALES_CONSTANTS } from './constants/sales.constants';
import { SaleFilters } from './interfaces/sales.interface';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly excelService: SalesExcelService,
  ) {}

  @Get()
  async findAll(@Query() filters: SaleFilters) {
    try {
      return await this.salesService.findAll(filters);
    } catch (error) {
      throw new HttpException(SALES_CONSTANTS.ERROR_MESSAGES.FETCH_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('stats')
  async getStats(@Query() filters: SaleFilters) {
    try {
      return await this.salesService.getStats(filters);
    } catch (error) {
      throw new HttpException(SALES_CONSTANTS.ERROR_MESSAGES.FETCH_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('history')
  async getHistory() {
    try {
      return await this.salesService.getHistory();
    } catch (error) {
      throw new HttpException(SALES_CONSTANTS.ERROR_MESSAGES.FETCH_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Post()
  async create(@Body() createSaleDto: any) {
    try {
      return await this.salesService.createSale(createSaleDto);
    } catch (error) {
      throw new HttpException(SALES_CONSTANTS.ERROR_MESSAGES.CREATE_ERROR, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateSaleDto: UpdateSaleDto) {
    return this.salesService.update(id, updateSaleDto);
  }

  @Get('export/excel')
  async exportExcel(@Res() res: Response) {
    const buffer = await this.excelService.exportToExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="vendas_${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.end(buffer);
  }

  @Get('export/template')
  async exportTemplate(@Res() res: Response) {
    const buffer = await this.excelService.exportTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="modelo_vendas.xlsx"');
    res.end(buffer);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.salesService.remove(id);
  }
}
