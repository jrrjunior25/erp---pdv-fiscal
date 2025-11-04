import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CommissionsService {
  private readonly logger = new Logger(CommissionsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calcula e cria comissão para uma venda
   */
  async createCommission(saleId: string, sellerId: string) {
    try {
      this.logger.log(`Calculando comissão para venda ${saleId}`);

      // Buscar venda
      const sale = await this.prisma.sale.findUnique({
        where: { id: saleId },
      });

      if (!sale) {
        throw new NotFoundException('Venda não encontrada');
      }

      // Buscar vendedor
      const seller = await this.prisma.user.findUnique({
        where: { id: sellerId },
      });

      if (!seller) {
        throw new NotFoundException('Vendedor não encontrado');
      }

      // Calcular comissão
      const commissionRate = seller.commissionRate;
      const commissionValue = sale.total * (commissionRate / 100);

      // Criar comissão
      const commission = await this.prisma.commission.create({
        data: {
          saleId,
          sellerId,
          saleTotal: sale.total,
          commissionRate,
          commissionValue,
          status: 'PENDING',
        },
        include: {
          sale: true,
          seller: true,
        },
      });

      this.logger.log(`Comissão criada: R$ ${commissionValue.toFixed(2)} (${commissionRate}%)`);

      return commission;
    } catch (error) {
      this.logger.error(`Erro ao criar comissão: ${error.message}`);
      throw error;
    }
  }

  /**
   * Marca comissão como paga
   */
  async payCommission(commissionId: string) {
    try {
      this.logger.log(`Pagando comissão ${commissionId}`);

      const commission = await this.prisma.commission.findUnique({
        where: { id: commissionId },
      });

      if (!commission) {
        throw new NotFoundException('Comissão não encontrada');
      }

      const updated = await this.prisma.commission.update({
        where: { id: commissionId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
        include: {
          seller: true,
          sale: true,
        },
      });

      // Criar movimentação financeira
      await this.prisma.financialMovement.create({
        data: {
          type: 'SAIDA',
          description: `Comissão - ${updated.seller.name} - Venda #${updated.sale.number}`,
          amount: commission.commissionValue,
          date: new Date(),
          category: 'COMISSAO',
          status: 'COMPLETED',
        },
      });

      this.logger.log(`Comissão paga com sucesso`);

      return updated;
    } catch (error) {
      this.logger.error(`Erro ao pagar comissão: ${error.message}`);
      throw error;
    }
  }

  /**
   * Paga várias comissões em lote
   */
  async payMultipleCommissions(commissionIds: string[]) {
    const results = [];
    
    for (const id of commissionIds) {
      try {
        const result = await this.payCommission(id);
        results.push({ id, success: true, result });
      } catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Lista todas as comissões
   */
  async findAll(filters?: {
    sellerId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (filters?.sellerId) {
      where.sellerId = filters.sellerId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return this.prisma.commission.findMany({
      where,
      include: {
        seller: true,
        sale: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Busca comissão por ID
   */
  async findOne(id: string) {
    const commission = await this.prisma.commission.findUnique({
      where: { id },
      include: {
        seller: true,
        sale: {
          include: {
            customer: true,
            items: true,
          },
        },
      },
    });

    if (!commission) {
      throw new NotFoundException('Comissão não encontrada');
    }

    return commission;
  }

  /**
   * Relatório de comissões por vendedor
   */
  async getCommissionReport(filters?: {
    sellerId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (filters?.sellerId) {
      where.sellerId = filters.sellerId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const commissions = await this.prisma.commission.findMany({
      where,
      include: {
        seller: true,
        sale: true,
      },
    });

    // Agrupar por vendedor
    const report = commissions.reduce((acc, commission) => {
      const sellerId = commission.sellerId;
      
      if (!acc[sellerId]) {
        acc[sellerId] = {
          seller: commission.seller,
          totalSales: 0,
          totalSalesValue: 0,
          totalCommissionValue: 0,
          pendingCommissionValue: 0,
          paidCommissionValue: 0,
          commissions: [],
        };
      }

      acc[sellerId].totalSales++;
      acc[sellerId].totalSalesValue += commission.saleTotal;
      acc[sellerId].totalCommissionValue += commission.commissionValue;
      
      if (commission.status === 'PENDING') {
        acc[sellerId].pendingCommissionValue += commission.commissionValue;
      } else if (commission.status === 'PAID') {
        acc[sellerId].paidCommissionValue += commission.commissionValue;
      }

      acc[sellerId].commissions.push(commission);

      return acc;
    }, {});

    return Object.values(report);
  }

  /**
   * Totaliza comissões pendentes por vendedor
   */
  async getPendingCommissionsBySeller(sellerId: string) {
    const commissions = await this.prisma.commission.findMany({
      where: {
        sellerId,
        status: 'PENDING',
      },
      include: {
        sale: true,
      },
    });

    const total = commissions.reduce((sum, c) => sum + c.commissionValue, 0);

    return {
      sellerId,
      pendingCommissions: commissions.length,
      totalPending: total,
      commissions,
    };
  }
}
