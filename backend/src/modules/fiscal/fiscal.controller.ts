import { Controller, Post, Body, UseGuards, Get, Param, Put, Query, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FiscalService } from './fiscal.service';
import { IssueNfceDto } from './dto/issue-nfce.dto';
import { IssueNfeDto } from './dto/issue-nfe.dto';
import { GeneratePixDto } from './dto/generate-pix.dto';
import { FISCAL_CONSTANTS } from './constants/fiscal.constants';

@Controller('fiscal')
export class FiscalController {
  constructor(private readonly fiscalService: FiscalService) {}

  @Post('pix/generate')
  async generatePix(@Body() dto: GeneratePixDto) {
    try {
      console.log('PIX Generate Request:', dto);
      
      if (!dto.amount || dto.amount <= 0) {
        throw new HttpException('Valor deve ser maior que zero', HttpStatus.BAD_REQUEST);
      }
      
      const result = await this.fiscalService.generatePixCharge(dto);
      console.log('PIX Generated Successfully:', result.txId);
      return result;
    } catch (error) {
      console.error('PIX Generation Error:', error.message);
      throw new HttpException(
        error.message || 'Erro ao gerar PIX',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('issue-nfce')
  @UseGuards(JwtAuthGuard)
  async issueNfce(@Body() dto: IssueNfceDto) {
    try {
      return await this.fiscalService.issueNfce(dto);
    } catch (error) {
      throw new HttpException(FISCAL_CONSTANTS.ERROR_MESSAGES.NFCE_ERROR, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('issue-nfe')
  @UseGuards(JwtAuthGuard)
  async issueNfe(@Body() dto: IssueNfeDto) {
    try {
      return await this.fiscalService.issueNfe(dto);
    } catch (error) {
      throw new HttpException(error.message || 'Erro ao emitir NF-e', HttpStatus.BAD_REQUEST);
    }
  }

  @Post('generate-pix')
  async generatePixLegacy(@Body() dto: GeneratePixDto) {
    return this.fiscalService.generatePixCharge(dto);
  }

  @Get('nfce/:id')
  @UseGuards(JwtAuthGuard)
  async getNfce(@Param('id') id: string) {
    return this.fiscalService.getNfceById(id);
  }

  @Get('nfce/:id/xml')
  @UseGuards(JwtAuthGuard)
  async getNfceXml(@Param('id') id: string) {
    return this.fiscalService.getNfceXml(id);
  }

  @Get('config')
  @UseGuards(JwtAuthGuard)
  async getConfig() {
    return this.fiscalService.getFiscalConfig();
  }

  @Post('config')
  @UseGuards(JwtAuthGuard)
  async saveConfig(@Body() data: any) {
    return this.fiscalService.saveFiscalConfig(data);
  }

  @Put('config')
  @UseGuards(JwtAuthGuard)
  async updateConfig(@Body() data: any) {
    return this.fiscalService.saveFiscalConfig(data);
  }

  @Post('certificate')
  @UseGuards(JwtAuthGuard)
  async uploadCertificate(@Body() data: { certificate: string; password: string }) {
    try {
      return await this.fiscalService.uploadCertificate(data.certificate, data.password);
    } catch (error) {
      throw new HttpException(FISCAL_CONSTANTS.ERROR_MESSAGES.CERTIFICATE_ERROR, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('sefaz/status')
  @UseGuards(JwtAuthGuard)
  async checkSefazStatus() {
    return this.fiscalService.checkSefazStatus();
  }

  @Get('xmls')
  @UseGuards(JwtAuthGuard)
  async listSavedXmls(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const yearNum = year ? parseInt(year) : undefined;
    const monthNum = month ? parseInt(month) : undefined;
    return this.fiscalService.listSavedXmls(yearNum, monthNum);
  }

  @Get('nfce/:id/pdf')
  @UseGuards(JwtAuthGuard)
  async getNfcePdf(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.fiscalService.getNfcePdf(id);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      
      return res.send(result.pdf);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('nfe/:id/danfe')
  @UseGuards(JwtAuthGuard)
  async getNfeDanfe(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.fiscalService.getNfeDanfe(id);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      
      return res.send(result.pdf);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('pdfs')
  @UseGuards(JwtAuthGuard)
  async listSavedPdfs(
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('day') day?: string,
  ) {
    const yearNum = year ? parseInt(year) : undefined;
    const monthNum = month ? parseInt(month) : undefined;
    const dayNum = day ? parseInt(day) : undefined;
    return this.fiscalService.listSavedPdfs(yearNum, monthNum, dayNum);
  }

  @Post('nfce/:id/regenerate-pdf')
  @UseGuards(JwtAuthGuard)
  async regenerateNfcePdf(@Param('id') id: string) {
    try {
      return await this.fiscalService.regenerateNfcePdf(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
