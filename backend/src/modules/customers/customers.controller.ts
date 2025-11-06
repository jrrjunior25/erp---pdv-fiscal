import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpException, HttpStatus, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomersService } from './customers.service';
import { CustomerExcelService } from './services/customer-excel.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { CUSTOMERS_CONSTANTS } from './constants/customers.constants';
import { CustomerFilters } from './interfaces/customers.interface';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly excelService: CustomerExcelService,
  ) {}

  @Get('export/excel')
  async exportExcel(@Res() res: Response) {
    const buffer = await this.excelService.exportToExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="clientes_${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.end(buffer);
  }

  @Get('export/template')
  async exportTemplate(@Res() res: Response) {
    const buffer = await this.excelService.exportTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="modelo_importacao_clientes.xlsx"');
    res.end(buffer);
  }

  @Post('import/excel')
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error('Nenhum arquivo foi enviado');
    return this.excelService.importFromExcel(file.buffer);
  }

  @Get()
  async findAll(@Query() filters: CustomerFilters) {
    try {
      return await this.customersService.findAll(filters);
    } catch (error) {
      throw new HttpException(CUSTOMERS_CONSTANTS.ERROR_MESSAGES.FETCH_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('stats')
  async getStats() {
    try {
      return await this.customersService.getStats();
    } catch (error) {
      throw new HttpException(CUSTOMERS_CONSTANTS.ERROR_MESSAGES.FETCH_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
