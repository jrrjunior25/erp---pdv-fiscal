import { Controller, Post, Body, UseGuards, Get, Param, Put } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FiscalService } from './fiscal.service';
import { IssueNfceDto } from './dto/issue-nfce.dto';
import { GeneratePixDto } from './dto/generate-pix.dto';

@Controller('fiscal')
export class FiscalController {
  constructor(private readonly fiscalService: FiscalService) {}

  @Post('pix/generate')
  async generatePix(@Body() dto: GeneratePixDto) {
    return this.fiscalService.generatePixCharge(dto);
  }

  @Post('issue-nfce')
  @UseGuards(JwtAuthGuard)
  async issueNfce(@Body() dto: IssueNfceDto) {
    return this.fiscalService.issueNfce(dto);
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
    return this.fiscalService.uploadCertificate(data.certificate, data.password);
  }

  @Get('sefaz/status')
  @UseGuards(JwtAuthGuard)
  async checkSefazStatus() {
    return this.fiscalService.checkSefazStatus();
  }
}
