import { Controller, Get, Post, Put, Body, Param, UseGuards, Query, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QuotationsService } from './quotations.service';

@Controller('quotations')
@UseGuards(JwtAuthGuard)
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post()
  async create(@Body() createQuotationDto: any) {
    return this.quotationsService.create(createQuotationDto);
  }

  @Post(':id/convert')
  async convertToSale(
    @Param('id') id: string,
    @Body() data: { shiftId: string; paymentMethod: string },
  ) {
    return this.quotationsService.convertToSale(id, data.shiftId, data.paymentMethod);
  }

  @Post('mark-expired')
  async markExpired() {
    return this.quotationsService.markExpired();
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.quotationsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.quotationsService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateQuotationDto: any) {
    return this.quotationsService.update(id, updateQuotationDto);
  }

  @Delete(':id')
  async cancel(@Param('id') id: string) {
    return this.quotationsService.cancel(id);
  }
}
