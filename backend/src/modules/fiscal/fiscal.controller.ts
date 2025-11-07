import { Controller, Post, Body, UseGuards, Get, Param, Put, Query, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FiscalService } from './fiscal.service';
import { IssueNfceDto } from './dto/issue-nfce.dto';
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
}
