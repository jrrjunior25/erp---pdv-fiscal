import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FinancialsService } from './financials.service';

@Controller('financials')
@UseGuards(JwtAuthGuard)
export class FinancialsController {
  constructor(private readonly financialsService: FinancialsService) {}

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
