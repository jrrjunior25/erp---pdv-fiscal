import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface CreateQuotationDto {
  customerId?: string;
  sellerId?: string;
  validUntil: Date;
  observations?: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    discount?: number;
  }>;
}

@Injectable()
export class QuotationsService {
  private readonly logger = new Logger(QuotationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Cria um novo orçamento
   */
  async create(data: CreateQuotationDto) {
    try {
      this.logger.log('Criando novo orçamento');

      // Gerar próximo número
      const lastQuotation = await this.prisma.quotation.findFirst({
        orderBy: { number: 'desc' },
      });
      const nextNumber = (lastQuotation?.number || 0) + 1;

      // Calcular totais
      let total = 0;
      let totalDiscount = 0;

      for (const item of data.items) {
        const itemDiscount = item.discount || 0;
        const itemTotal = (item.quantity * item.price) - itemDiscount;
        total += itemTotal;
        totalDiscount += itemDiscount;
      }

      // Criar orçamento
      const quotation = await this.prisma.quotation.create({
        data: {
          number: nextNumber,
          customerId: data.customerId,
          sellerId: data.sellerId,
          total,
          discount: totalDiscount,
          validUntil: data.validUntil,
          observations: data.observations,
          status: 'PENDING',
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              discount: item.discount || 0,
              total: (item.quantity * item.price) - (item.discount || 0),
            })),
          },
        },
        include: {
          items: true,
          customer: true,
          seller: true,
        },
      });

      this.logger.log(`Orçamento #${nextNumber} criado com sucesso`);

      return quotation;
    } catch (error) {
      this.logger.error(`Erro ao criar orçamento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Converte orçamento em venda
   */
  async convertToSale(quotationId: string, shiftId: string, paymentMethod: string) {
    try {
      this.logger.log(`Convertendo orçamento ${quotationId} em venda`);

      const quotation = await this.prisma.quotation.findUnique({
        where: { id: quotationId },
        include: {
          items: true,
        },
      });

      if (!quotation) {
        throw new NotFoundException('Orçamento não encontrado');
      }

      if (quotation.status !== 'PENDING') {
        throw new BadRequestException('Orçamento já foi convertido ou cancelado');
      }

      // Verificar validade
      if (new Date() > quotation.validUntil) {
        throw new BadRequestException('Orçamento expirado');
      }

      // Gerar próximo número de venda
      const lastSale = await this.prisma.sale.findFirst({
        orderBy: { number: 'desc' },
      });
      const nextSaleNumber = (lastSale?.number || 0) + 1;

      // Criar venda
      const sale = await this.prisma.sale.create({
        data: {
          number: nextSaleNumber,
          customerId: quotation.customerId,
          sellerId: quotation.sellerId,
          shiftId,
          total: quotation.total,
          discount: quotation.discount,
          paymentMethod,
          status: 'COMPLETED',
          observations: `Convertido do orçamento #${quotation.number}`,
          items: {
            create: quotation.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              discount: item.discount,
              total: item.total,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
          seller: true,
        },
      });

      // Atualizar estoque
      for (const item of quotation.items) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Atualizar orçamento
      await this.prisma.quotation.update({
        where: { id: quotationId },
        data: {
          status: 'CONVERTED',
          convertedAt: new Date(),
          saleId: sale.id,
        },
      });

      this.logger.log(`Orçamento #${quotation.number} convertido em venda #${sale.number}`);

      return {
        quotation,
        sale,
      };
    } catch (error) {
      this.logger.error(`Erro ao converter orçamento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lista todos os orçamentos
   */
  async findAll(filters?: {
    status?: string;
    customerId?: string;
    sellerId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

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

    return this.prisma.quotation.findMany({
      where,
      include: {
        items: true,
        customer: true,
        seller: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Busca orçamento por ID
   */
  async findOne(id: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            quotation: true,
          },
        },
        customer: true,
        seller: true,
      },
    });

    if (!quotation) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    return quotation;
  }

  /**
   * Atualiza orçamento
   */
  async update(id: string, data: Partial<CreateQuotationDto>) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
    });

    if (!quotation) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    if (quotation.status !== 'PENDING') {
      throw new BadRequestException('Não é possível editar orçamento convertido ou cancelado');
    }

    // Se atualizar itens, recalcular total
    if (data.items) {
      let total = 0;
      let totalDiscount = 0;

      for (const item of data.items) {
        const itemDiscount = item.discount || 0;
        const itemTotal = (item.quantity * item.price) - itemDiscount;
        total += itemTotal;
        totalDiscount += itemDiscount;
      }

      // Deletar itens antigos
      await this.prisma.quotationItem.deleteMany({
        where: { quotationId: id },
      });

      // Criar novos itens
      await this.prisma.quotationItem.createMany({
        data: data.items.map(item => ({
          quotationId: id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount || 0,
          total: (item.quantity * item.price) - (item.discount || 0),
        })),
      });

      return this.prisma.quotation.update({
        where: { id },
        data: {
          total,
          discount: totalDiscount,
          validUntil: data.validUntil,
          observations: data.observations,
          customerId: data.customerId,
          sellerId: data.sellerId,
        },
        include: {
          items: true,
          customer: true,
          seller: true,
        },
      });
    }

    return this.prisma.quotation.update({
      where: { id },
      data: {
        validUntil: data.validUntil,
        observations: data.observations,
        customerId: data.customerId,
        sellerId: data.sellerId,
      },
      include: {
        items: true,
        customer: true,
        seller: true,
      },
    });
  }

  /**
   * Cancela orçamento
   */
  async cancel(id: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
    });

    if (!quotation) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    if (quotation.status !== 'PENDING') {
      throw new BadRequestException('Orçamento já foi convertido ou cancelado');
    }

    return this.prisma.quotation.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });
  }

  /**
   * Marca orçamentos expirados
   */
  async markExpired() {
    const now = new Date();

    const result = await this.prisma.quotation.updateMany({
      where: {
        status: 'PENDING',
        validUntil: {
          lt: now,
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    this.logger.log(`${result.count} orçamentos marcados como expirados`);

    return result;
  }
}
