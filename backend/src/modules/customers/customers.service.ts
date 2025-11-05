import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { CustomerFilters, CustomerStats } from './interfaces/customers.interface';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: CustomerFilters) {
    const where = filters ? {
      ...(filters.name && { name: { contains: filters.name, mode: 'insensitive' } }),
      ...(filters.email && { email: { contains: filters.email, mode: 'insensitive' } }),
    } : {};

    return this.prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats(): Promise<CustomerStats> {
    const total = await this.prisma.customer.count();
    
    const totalLoyaltyPoints = await this.prisma.customer.aggregate({
      _sum: { loyaltyPoints: true },
    });

    return {
      total,
      active: total, // Todos os clientes são considerados ativos
      inactive: 0,
      totalLoyaltyPoints: totalLoyaltyPoints._sum.loyaltyPoints || 0,
    };
  }

  async findOne(id: string) {
    return this.prisma.customer.findUnique({
      where: { id },
    });
  }

  async create(data: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: data as any,
    });
  }

  async update(id: string, data: UpdateCustomerDto) {
    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.customer.delete({
      where: { id },
    });
  }
}
