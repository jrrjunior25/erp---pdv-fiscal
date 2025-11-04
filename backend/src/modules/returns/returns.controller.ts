import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReturnsService } from './returns.service';

@Controller('returns')
@UseGuards(JwtAuthGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  async createReturn(@Body() createReturnDto: any, @Request() req) {
    return this.returnsService.createReturn(createReturnDto, req.user.userId);
  }

  @Post(':id/process')
  async processReturn(@Param('id') id: string, @Request() req) {
    return this.returnsService.processReturn(id, req.user.userId);
  }

  @Post(':id/cancel')
  async cancelReturn(@Param('id') id: string) {
    return this.returnsService.cancel(id);
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.returnsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.returnsService.findOne(id);
  }

  @Get('sale/:saleId')
  async findBySale(@Param('saleId') saleId: string) {
    return this.returnsService.findBySale(saleId);
  }
}
