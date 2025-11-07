import { Controller, Get, UseGuards, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  getAnalytics(@Query('period') period: string = '30') {
    return this.analyticsService.getAnalytics(parseInt(period));
  }

  @Get('dashboard')
  getDashboard() {
    return this.analyticsService.getDashboard();
  }

  @Get('export/excel')
  async exportExcel(@Query('period') period: string = '30', @Res() res: Response) {
    try {
      const buffer = await this.analyticsService.exportToExcel(parseInt(period));
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=analytics_${period}d_${new Date().toISOString().split('T')[0]}.xlsx`);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'no-cache');
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao exportar analytics', error: error.message });
    }
  }
}
