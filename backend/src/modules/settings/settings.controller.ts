import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Put()
  updateSettings(@Body() data: any) {
    return this.settingsService.updateSettings(data);
  }

  @Put('certificate')
  uploadCertificate(@Body() data: any) {
    return this.settingsService.uploadCertificate(data);
  }

  @Put('logo')
  uploadLogo(@Body() data: any) {
    return this.settingsService.uploadLogo(data);
  }

  @Put('wallpaper')
  uploadWallpaper(@Body() data: any) {
    return this.settingsService.uploadWallpaper(data);
  }
}
