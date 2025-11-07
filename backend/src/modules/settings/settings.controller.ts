import { Controller, Get, Put, Body, UseGuards, HttpStatus, HttpException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto, CertificateUploadDto, FileUploadDto } from './dto/settings.dto';
import { SETTINGS_CONSTANTS } from './constants/settings.constants';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings() {
    try {
      return await this.settingsService.getSettings();
    } catch (error) {
      throw new HttpException(SETTINGS_CONSTANTS.ERROR_MESSAGES.SETTINGS_FETCH_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put()
  async updateSettings(@Body() data: any) {
    try {
      return await this.settingsService.updateSettings(data);
    } catch (error) {
      throw new HttpException(error.message || SETTINGS_CONSTANTS.ERROR_MESSAGES.SETTINGS_UPDATE_ERROR, HttpStatus.BAD_REQUEST);
    }
  }

  @Put('certificate')
  async uploadCertificate(@Body() data: CertificateUploadDto) {
    try {
      return await this.settingsService.uploadCertificate(data);
    } catch (error) {
      throw new HttpException(SETTINGS_CONSTANTS.ERROR_MESSAGES.CERTIFICATE_UPLOAD_ERROR, HttpStatus.BAD_REQUEST);
    }
  }

  @Put('logo')
  async uploadLogo(@Body() data: FileUploadDto) {
    try {
      return await this.settingsService.uploadLogo(data);
    } catch (error) {
      throw new HttpException(SETTINGS_CONSTANTS.ERROR_MESSAGES.LOGO_UPLOAD_ERROR, HttpStatus.BAD_REQUEST);
    }
  }

  @Put('wallpaper')
  async uploadWallpaper(@Body() data: FileUploadDto) {
    try {
      return await this.settingsService.uploadWallpaper(data);
    } catch (error) {
      throw new HttpException(SETTINGS_CONSTANTS.ERROR_MESSAGES.WALLPAPER_UPLOAD_ERROR, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('certificate/status')
  async getCertificateStatus() {
    try {
      return await this.settingsService.getCertificateStatus();
    } catch (error) {
      throw new HttpException('Erro ao verificar status do certificado', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
