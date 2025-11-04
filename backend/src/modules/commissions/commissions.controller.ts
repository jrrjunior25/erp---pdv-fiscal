import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommissionsService } from './commissions.service';

@Controller('commissions')
@UseGuards(JwtAuthGuard)
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Post()
  async createCommission(@Body() data: { saleId: string; sellerId: string }) {
    return this.commissionsService.createCommission(data.saleId, data.sellerId);
  }

  @Post(':id/pay')
  async payCommission(@Param('id') id: string) {
    return this.commissionsService.payCommission(id);
  }

  @Post('pay-multiple')
  async payMultipleCommissions(@Body() data: { commissionIds: string[] }) {
    return this.commissionsService.payMultipleCommissions(data.commissionIds);
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.commissionsService.findAll(query);
  }

  @Get('report')
  async getReport(@Query() query: any) {
    return this.commissionsService.getCommissionReport(query);
  }

  @Get('seller/:sellerId/pending')
  async getPendingBySeller(@Param('sellerId') sellerId: string) {
    return this.commissionsService.getPendingCommissionsBySeller(sellerId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.commissionsService.findOne(id);
  }
}
