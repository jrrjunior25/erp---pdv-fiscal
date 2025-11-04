import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateShiftDto, UpdateShiftDto } from './dto/shift.dto';

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.shift.findMany({
      orderBy: { openedAt: 'desc' },
    });
  }

  async getHistory() {
    return this.prisma.shift.findMany({
      orderBy: { openedAt: 'desc' },
      take: 100,
    });
  }

  async getCurrent() {
    return this.prisma.shift.findFirst({
      where: { status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
    });
  }

  async getAllOpenShifts() {
    return this.prisma.shift.findMany({
      where: { status: 'OPEN' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { openedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.shift.findUnique({
      where: { id },
    });
  }

  async create(data: CreateShiftDto) {
    return this.prisma.shift.create({
      data: data as any,
    });
  }

  async update(id: string, data: UpdateShiftDto) {
    return this.prisma.shift.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.shift.delete({
      where: { id },
    });
  }

  async openShift(data: { openingBalance: number; userId: string; userName: string }) {
    try {
      console.log('[Shifts] Received open shift request:', JSON.stringify(data, null, 2));

      // Validate input
      if (!data.userId || !data.userName) {
        throw new Error('userId e userName são obrigatórios');
      }

      if (typeof data.openingBalance !== 'number' || isNaN(data.openingBalance)) {
        throw new Error(`Saldo de abertura inválido: ${data.openingBalance}`);
      }

      // Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id: data.userId },
      });

      if (!user) {
        throw new Error(`Usuário não encontrado: ${data.userId}`);
      }

      // Check if there's already an open shift
      const existingOpenShift = await this.prisma.shift.findFirst({
        where: { status: 'OPEN' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (existingOpenShift) {
        console.log('[Shifts] Found existing open shift:', existingOpenShift.number);
        throw new Error(
          `Já existe um turno aberto (#${existingOpenShift.number}) pelo usuário ${existingOpenShift.user.name}. ` +
          `Por favor, feche o turno antes de abrir um novo.`
        );
      }

      // Get the next shift number
      const lastShift = await this.prisma.shift.findFirst({
        orderBy: { number: 'desc' },
      });
      const nextNumber = (lastShift?.number || 0) + 1;

      console.log(`[Shifts] Opening shift #${nextNumber} for ${data.userName} with balance: R$ ${data.openingBalance}`);

      const newShift = await this.prisma.shift.create({
        data: {
          number: nextNumber,
          userId: data.userId,
          openingCash: Number(data.openingBalance),
          status: 'OPEN',
          openedAt: new Date(),
        },
      });

      console.log('[Shifts] Shift created successfully:', newShift.id);
      return newShift;
    } catch (error) {
      console.error('[Shifts] Error opening shift:', error.message || error);
      throw new Error(error.message || 'Erro ao abrir turno');
    }
  }

  async closeShift(data: { closingBalance: number }) {
    try {
      const currentShift = await this.getCurrent();
      if (!currentShift) {
        throw new Error('Nenhum turno aberto encontrado');
      }

      console.log(`[Shifts] Closing shift #${currentShift.number} with closing balance: ${data.closingBalance}`);

      return await this.prisma.shift.update({
        where: { id: currentShift.id },
        data: {
          closingCash: Number(data.closingBalance),
          status: 'CLOSED',
          closedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('[Shifts] Error closing shift:', error);
      throw new Error(error.message || 'Erro ao fechar turno');
    }
  }

  async closeShiftById(id: string, closingBalance: number) {
    const shift = await this.prisma.shift.findUnique({
      where: { id },
    });

    if (!shift) {
      throw new Error('Shift not found');
    }

    if (shift.status === 'CLOSED') {
      throw new Error('Shift is already closed');
    }

    console.log(`[Shifts] Admin closing shift #${shift.number} with closing balance: ${closingBalance}`);

    return this.prisma.shift.update({
      where: { id },
      data: {
        closingCash: closingBalance,
        status: 'CLOSED',
        closedAt: new Date(),
      },
    });
  }

  async addMovement(data: { type: string; amount: number; reason: string; userId: string }) {
    const currentShift = await this.getCurrent();
    if (!currentShift) {
      throw new Error('No open shift found');
    }

    // Create financial movement
    await this.prisma.financialMovement.create({
      data: {
        type: data.type === 'Suprimento' ? 'INCOME' : 'EXPENSE',
        description: `${data.type}: ${data.reason}`,
        amount: data.amount,
        date: new Date(),
        category: data.type,
        status: 'COMPLETED',
      },
    });

    // Update shift opening cash
    const newOpeningCash = data.type === 'Suprimento' 
      ? currentShift.openingCash + data.amount
      : currentShift.openingCash - data.amount;

    return this.prisma.shift.update({
      where: { id: currentShift.id },
      data: {
        openingCash: newOpeningCash,
      },
    });
  }
}
