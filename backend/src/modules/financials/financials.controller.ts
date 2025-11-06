import { Controller, Get, Post, Patch, Body, Param, UseGuards, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FinancialsService } from './financials.service';
import { FinancialExcelService } from './services/financial-excel.service';

@Controller('financials')
@UseGuards(JwtAuthGuard)
export class FinancialsController {
  constructor(
    private readonly financialsService: FinancialsService,
    private readonly excelService: FinancialExcelService,
  ) {}

  @Get('export/excel')
  async exportExcel(@Res() res: Response) {
    const buffer = await this.excelService.exportToExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="financeiro_${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.end(buffer);
  }

  @Get('export/template')
  async exportTemplate(@Res() res: Response) {
    const buffer = await this.excelService.exportTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="modelo_importacao_financeiro.xlsx"');
    res.end(buffer);
  }

  @Post('import/excel')
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error('Nenhum arquivo foi enviado');
    return this.excelService.importFromExcel(file.buffer);
  }

  @Get()
  findAll() {
    return this.financialsService.findAll();
  }

  @Post()
  create(@Body() data: any) {
    return this.financialsService.create(data);
  }

  @Post('settle-debt/:customerId')
  settleDebt(@Param('customerId') customerId: string) {
    return this.financialsService.settleDebt(customerId);
  }

  @Patch('transactions/:transactionId/status')
  updateTransactionStatus(
    @Param('transactionId') transactionId: string,
    @Body() data: { status: string },
  ) {
    return this.financialsService.updateTransactionStatus(transactionId, data.status);
  }
}
