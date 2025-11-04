import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface CreateReturnDto {
  saleId: string;
  type: 'DEVOLUCAO' | 'TROCA';
  reason: string;
  refundMethod: string;
  observations?: string;
  items: Array<{
    saleItemId: string;
    productId: string;
    quantity: number;
    price: number;
    reason?: string;
  }>;
}

@Injectable()
export class ReturnsService {
  private readonly logger = new Logger(ReturnsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Cria uma devolução ou troca
   */
  async createReturn(data: CreateReturnDto, userId: string) {
    try {
      this.logger.log(`Criando ${data.type} para venda ${data.saleId}`);

      // Buscar venda original
      const sale = await this.prisma.sale.findUnique({
        where: { id: data.saleId },
        include: {
          items: true,
          nfe: true,
        },
      });

      if (!sale) {
        throw new NotFoundException('Venda não encontrada');
      }

      // Validar itens da devolução
      for (const item of data.items) {
        const saleItem = sale.items.find(si => si.id === item.saleItemId);
        if (!saleItem) {
          throw new BadRequestException(`Item ${item.saleItemId} não encontrado na venda`);
        }

        if (item.quantity > saleItem.quantity) {
          throw new BadRequestException(
            `Quantidade a devolver (${item.quantity}) maior que quantidade vendida (${saleItem.quantity})`
          );
        }
      }

      // Calcular total da devolução
      const total = data.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

      // Gerar próximo número
      const lastReturn = await this.prisma.saleReturn.findFirst({
        orderBy: { number: 'desc' },
      });
      const nextNumber = (lastReturn?.number || 0) + 1;

      // Criar devolução
      const saleReturn = await this.prisma.saleReturn.create({
        data: {
          number: nextNumber,
          saleId: data.saleId,
          type: data.type,
          reason: data.reason,
          total,
          refundMethod: data.refundMethod,
          status: 'PENDING',
          observations: data.observations,
          items: {
            create: data.items.map(item => ({
              saleItemId: item.saleItemId,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              total: item.quantity * item.price,
              reason: item.reason,
            })),
          },
        },
        include: {
          items: true,
          sale: {
            include: {
              customer: true,
            },
          },
        },
      });

      this.logger.log(`Devolução #${nextNumber} criada com sucesso`);

      return saleReturn;
    } catch (error) {
      this.logger.error(`Erro ao criar devolução: ${error.message}`);
      throw error;
    }
  }

  /**
   * Processa uma devolução (finaliza)
   */
  async processReturn(returnId: string, userId: string) {
    try {
      this.logger.log(`Processando devolução ${returnId}`);

      const saleReturn = await this.prisma.saleReturn.findUnique({
        where: { id: returnId },
        include: {
          items: true,
          sale: true,
        },
      });

      if (!saleReturn) {
        throw new NotFoundException('Devolução não encontrada');
      }

      if (saleReturn.status !== 'PENDING') {
        throw new BadRequestException('Devolução já foi processada');
      }

      // Atualizar estoque (devolver produtos)
      for (const item of saleReturn.items) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      // Atualizar status da devolução
      const updatedReturn = await this.prisma.saleReturn.update({
        where: { id: returnId },
        data: {
          status: 'PROCESSED',
          processedAt: new Date(),
          processedBy: userId,
        },
        include: {
          items: true,
          sale: {
            include: {
              customer: true,
            },
          },
        },
      });

      // Criar movimentação financeira (se houver reembolso em dinheiro)
      if (saleReturn.refundMethod === 'DINHEIRO' || saleReturn.refundMethod === 'CREDITO_LOJA') {
        await this.prisma.financialMovement.create({
          data: {
            type: 'SAIDA',
            description: `Devolução #${saleReturn.number} - Venda #${saleReturn.sale.number}`,
            amount: saleReturn.total,
            date: new Date(),
            category: 'DEVOLUCAO',
            status: 'COMPLETED',
          },
        });
      }

      this.logger.log(`Devolução #${saleReturn.number} processada com sucesso`);

      return updatedReturn;
    } catch (error) {
      this.logger.error(`Erro ao processar devolução: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lista todas as devoluções
   */
  async findAll(filters?: { status?: string; type?: string; startDate?: Date; endDate?: Date }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.type) {
      where.type = filters.type;
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

    return this.prisma.saleReturn.findMany({
      where,
      include: {
        items: true,
        sale: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Busca uma devolução por ID
   */
  async findOne(id: string) {
    const saleReturn = await this.prisma.saleReturn.findUnique({
      where: { id },
      include: {
        items: true,
        sale: {
          include: {
            customer: true,
            items: true,
          },
        },
      },
    });

    if (!saleReturn) {
      throw new NotFoundException('Devolução não encontrada');
    }

    return saleReturn;
  }

  /**
   * Cancela uma devolução
   */
  async cancel(id: string) {
    const saleReturn = await this.prisma.saleReturn.findUnique({
      where: { id },
    });

    if (!saleReturn) {
      throw new NotFoundException('Devolução não encontrada');
    }

    if (saleReturn.status === 'PROCESSED') {
      throw new BadRequestException('Não é possível cancelar uma devolução já processada');
    }

    return this.prisma.saleReturn.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });
  }

  /**
   * Busca devoluções de uma venda específica
   */
  async findBySale(saleId: string) {
    return this.prisma.saleReturn.findMany({
      where: { saleId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
