import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ShiftsService } from './shifts.service';
import { CreateShiftDto, UpdateShiftDto } from './dto/shift.dto';

@Controller('shifts')
@UseGuards(JwtAuthGuard)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  findAll() {
    return this.shiftsService.findAll();
  }

  @Get('history')
  getHistory() {
    return this.shiftsService.getHistory();
  }

  @Get('current')
  getCurrent() {
    return this.shiftsService.getCurrent();
  }

  @Get('open/all')
  getAllOpenShifts() {
    return this.shiftsService.getAllOpenShifts();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shiftsService.findOne(id);
  }

  @Post()
  create(@Body() createShiftDto: CreateShiftDto) {
    return this.shiftsService.create(createShiftDto);
  }

  @Post('open')
  async openShift(@Body() data: { openingBalance: number; userId: string; userName: string }) {
    try {
      console.log('[ShiftsController] Received open shift request:', data);
      const result = await this.shiftsService.openShift(data);
      console.log('[ShiftsController] Shift opened successfully');
      return result;
    } catch (error) {
      console.error('[ShiftsController] Error opening shift:', error);
      throw error;
    }
  }

  @Post('close')
  closeShift(@Body() data: { closingBalance: number }) {
    return this.shiftsService.closeShift(data);
  }

  @Post('close/:id')
  closeShiftById(@Param('id') id: string, @Body() data: { closingBalance: number }) {
    return this.shiftsService.closeShiftById(id, data.closingBalance);
  }

  @Post('movement')
  addMovement(@Body() data: { type: string; amount: number; reason: string; userId: string }) {
    return this.shiftsService.addMovement(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateShiftDto: UpdateShiftDto) {
    return this.shiftsService.update(id, updateShiftDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shiftsService.remove(id);
  }
}
