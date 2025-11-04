import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PurchasingService } from './purchasing.service';

@Controller('purchasing')
@UseGuards(JwtAuthGuard)
export class PurchasingController {
  constructor(private readonly purchasingService: PurchasingService) {}

  @Get('orders')
  getOrders() {
    return this.purchasingService.getOrders();
  }

  @Post('orders')
  createOrder(@Body() data: any) {
    return this.purchasingService.createOrder(data);
  }

  @Patch('orders/:orderId/status')
  updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() data: { status: string },
  ) {
    return this.purchasingService.updateOrderStatus(orderId, data.status);
  }
}
