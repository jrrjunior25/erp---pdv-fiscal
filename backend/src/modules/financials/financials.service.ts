import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FinancialsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.financialMovement.findMany({
      orderBy: { date: 'desc' },
      take: 100,
    });
  }

  async create(data: any) {
    return this.prisma.financialMovement.create({
      data: {
        type: data.type,
        description: data.description,
        amount: data.amount,
        date: data.date || new Date(),
        category: data.category,
        status: data.status || 'PENDING',
      },
    });
  }

  async settleDebt(customerId: string) {
    // This is a simplified implementation
    // In a real scenario, you'd have a more complex debt management system
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    return { message: 'Debt settled', customerId };
  }

  async updateTransactionStatus(transactionId: string, status: string) {
    return this.prisma.financialMovement.update({
      where: { id: transactionId },
      data: { status },
    });
  }
}
