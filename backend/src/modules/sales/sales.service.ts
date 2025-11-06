import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FiscalService } from '../fiscal/fiscal.service';
import { CommissionsService } from '../commissions/commissions.service';
import { CreateSaleDto, UpdateSaleDto } from './dto/sale.dto';
import { SaleFilters, SaleStats } from './interfaces/sales.interface';
import { SALES_CONSTANTS } from './constants/sales.constants';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private prisma: PrismaService,
    private fiscalService: FiscalService,
    private commissionsService: CommissionsService,
  ) {}

  async findAll(filters?: SaleFilters) {
    const where = this.buildWhereClause(filters);
    
    return this.prisma.sale.findMany({
      where,
      include: {
        items: {
          include: {
            product: { select: { name: true } }
          }
        },
        payments: true,
        customer: { select: { name: true } },
        shift: { select: { number: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private buildWhereClause(filters?: SaleFilters) {
    if (!filters) return {};

    return {
      ...(filters.startDate && { createdAt: { gte: filters.startDate } }),
      ...(filters.endDate && { createdAt: { lte: filters.endDate } }),
      ...(filters.customerId && { customerId: filters.customerId }),
      ...(filters.sellerId && { sellerId: filters.sellerId }),
      ...(filters.paymentMethod && { paymentMethod: filters.paymentMethod }),
      ...(filters.status && { status: filters.status }),
    };
  }

  async getHistory() {
    const sales = await this.prisma.sale.findMany({
      include: {
        items: {
          include: {
            product: { select: { name: true } }
          }
        },
        payments: true,
        customer: { select: { name: true } },
        shift: { select: { number: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return sales.map(sale => ({
      id: sale.id,
      number: sale.number,
      date: sale.createdAt,
      customerName: sale.customer?.name || 'Cliente Avulso',
      items: sale.items.map(item => ({
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      })),
      total: sale.total,
      discount: sale.discount,
      paymentMethod: sale.paymentMethod,
      payments: sale.payments.map(payment => ({
        method: payment.method,
        amount: payment.amount,
        installments: payment.installments,
        changeGiven: payment.changeGiven
      })),
      status: sale.status,
      shiftNumber: sale.shift?.number
    }));
  }

  async findOne(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        },
        payments: true,
        customer: true,
        shift: true
      },
    });

    if (!sale) {
      throw new NotFoundException(SALES_CONSTANTS.VALIDATION_MESSAGES.SALE_NOT_FOUND);
    }

    return sale;
  }

  async create(data: CreateSaleDto) {
    return this.prisma.sale.create({
      data: data as any,
    });
  }

  async update(id: string, data: UpdateSaleDto) {
    return this.prisma.sale.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.sale.delete({
      where: { id },
    });
  }

  async createSale(saleData: any) {
    this.logger.log('Creating sale with data:', JSON.stringify(saleData, null, 2));

    await this.validateSaleData(saleData);

    // Get the next sale number
    const lastSale = await this.prisma.sale.findFirst({
      orderBy: { number: 'desc' },
    });
    const nextNumber = (lastSale?.number || 0) + 1;

    // Create sale with items and payments
    const sale = await this.prisma.sale.create({
      data: {
        number: nextNumber,
        customerId: saleData.customerId || null,
        shiftId: saleData.shiftId,
        total: saleData.total,
        discount: saleData.discount || 0,
        paymentMethod: saleData.payments?.[0]?.method || saleData.paymentMethod,
        status: 'COMPLETED',
        items: {
          create: saleData.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount || 0,
            total: item.total,
          })),
        },
        payments: {
          create: saleData.payments?.map((payment: any) => ({
            method: payment.method,
            amount: payment.amount,
            receivedAmount: payment.receivedAmount,
            changeGiven: payment.changeGiven,
            pixTxId: payment.pixTxId,
            cardAuthCode: payment.cardAuthCode,
            installments: payment.installments,
          })) || [{
            method: saleData.paymentMethod,
            amount: saleData.total,
          }],
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
        customer: true,
      },
    });

    // Update product stock
    for (const item of saleData.items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    // Update customer loyalty points if exists
    if (saleData.customerId) {
      const pointsChange = (saleData.loyaltyPointsEarned || 0) - (saleData.loyaltyPointsRedeemed || 0);
      if (pointsChange !== 0) {
        await this.prisma.customer.update({
          where: { id: saleData.customerId },
          data: {
            loyaltyPoints: {
              increment: pointsChange,
            },
          },
        });
      }
    }

    // Get updated shift
    const updatedShift = await this.prisma.shift.findUnique({
      where: { id: saleData.shiftId },
    });

    // Gerar comissão automaticamente se houver vendedor
    let commissionResult = null;
    if (sale.sellerId) {
      try {
        this.logger.log(`Gerando comissão para vendedor ${sale.sellerId}`);
        commissionResult = await this.commissionsService.createCommission(sale.id, sale.sellerId);
        this.logger.log(`Comissão criada: R$ ${commissionResult.commissionValue.toFixed(2)}`);
      } catch (error) {
        this.logger.error(`Erro ao gerar comissão: ${error.message}`);
        // Não falha a venda se a comissão falhar
      }
    }

    // Gerar NFC-e automaticamente
    let nfceResult = null;
    try {
      this.logger.log(`Gerando NFC-e para venda ${sale.id}`);
      
      nfceResult = await this.fiscalService.issueNfce({
        saleId: sale.id,
        items: sale.items.map(item => ({
          productId: item.productId,
          name: item.product.name,
          quantity: item.quantity,
          price: item.price,
          ncm: '00000000', // Buscar do produto se disponível
          cfop: '5102',
        })),
        total: sale.total,
        customerCpf: sale.customer?.document,
        customerName: sale.customer?.name,
      });

      this.logger.log(`NFC-e gerada: ${nfceResult.accessKey}`);
    } catch (error) {
      this.logger.error(`Erro ao gerar NFC-e: ${error.message}`);
      // Não falha a venda se a NFC-e falhar
    }

    // Gerar PIX automaticamente se o pagamento for PIX
    let pixResult = null;
    if (saleData.paymentMethod === 'PIX') {
      try {
        this.logger.log(`Gerando cobrança PIX para venda ${sale.id}`);
        
        pixResult = await this.fiscalService.generatePixCharge({
          amount: sale.total,
          saleId: sale.id,
          customerName: sale.customer?.name,
          description: `Venda #${sale.number}`,
        });

        this.logger.log(`PIX gerado: ${pixResult.txId}`);
      } catch (error) {
        this.logger.error(`Erro ao gerar PIX: ${error.message}`);
        // Não falha a venda se o PIX falhar
      }
    }

    return {
      saleRecord: sale,
      updatedShift,
      nfce: nfceResult,
      pix: pixResult,
      commission: commissionResult,
    };
  }

  private async validateSaleData(saleData: any) {
    if (!saleData.shiftId) {
      throw new BadRequestException(SALES_CONSTANTS.VALIDATION_MESSAGES.SHIFT_REQUIRED);
    }
    if (!saleData.items || saleData.items.length === 0) {
      throw new BadRequestException(SALES_CONSTANTS.VALIDATION_MESSAGES.ITEMS_REQUIRED);
    }
    if (!saleData.paymentMethod && !saleData.payments) {
      throw new BadRequestException(SALES_CONSTANTS.VALIDATION_MESSAGES.PAYMENT_METHOD_REQUIRED);
    }

    for (const item of saleData.items) {
      if (!item.productId) {
        throw new BadRequestException(SALES_CONSTANTS.VALIDATION_MESSAGES.PRODUCT_ID_REQUIRED);
      }
    }

    // Validar pagamentos
    const payments = saleData.payments || [{ method: saleData.paymentMethod, amount: saleData.total }];
    
    for (const payment of payments) {
      // Validar fiado
      if (payment.method === 'Fiado') {
        if (!saleData.customerId) {
          throw new BadRequestException('Cliente é obrigatório para vendas a prazo');
        }
        
        const customer = await this.prisma.customer.findUnique({
          where: { id: saleData.customerId },
          select: { id: true, name: true, document: true }
        });
        
        if (!customer) {
          throw new BadRequestException('Cliente não encontrado');
        }
        
        // Simular limite de crédito (em produção, viria do banco)
        const creditLimit = 1000; // R$ 1.000 de limite padrão
        const currentBalance = 0; // Buscar saldo atual do cliente
        const availableCredit = creditLimit - currentBalance;
        
        if (payment.amount > availableCredit) {
          throw new BadRequestException(`Limite de crédito insuficiente. Disponível: R$ ${availableCredit.toFixed(2)}`);
        }
      }
      
      // Validar parcelamento
      if (payment.method === 'Credito' && payment.installments) {
        if (payment.installments < 1 || payment.installments > 12) {
          throw new BadRequestException('Número de parcelas deve ser entre 1 e 12');
        }
        
        const minInstallmentValue = 10; // Valor mínimo da parcela
        const installmentValue = payment.amount / payment.installments;
        
        if (installmentValue < minInstallmentValue) {
          throw new BadRequestException(`Valor da parcela muito baixo. Mínimo: R$ ${minInstallmentValue.toFixed(2)}`);
        }
      }
    }
  }

  async getStats(filters?: SaleFilters): Promise<SaleStats> {
    const where = this.buildWhereClause(filters);

    const [salesCount, salesSum, topProducts, paymentStats] = await Promise.all([
      this.prisma.sale.count({ where }),
      this.prisma.sale.aggregate({ where, _sum: { total: true } }),
      this.getTopProducts(where),
      this.getPaymentMethodStats(where),
    ]);

    const totalRevenue = salesSum._sum.total || 0;
    const averageTicket = salesCount > 0 ? totalRevenue / salesCount : 0;

    return {
      totalSales: salesCount,
      totalRevenue,
      averageTicket,
      topProducts,
      paymentMethodStats: paymentStats,
    };
  }

  private async getTopProducts(where: any) {
    const result = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: { sale: where },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 10,
    });

    const products = await this.prisma.product.findMany({
      where: { id: { in: result.map(r => r.productId) } },
      select: { id: true, name: true },
    });

    return result.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        productName: product?.name || 'Produto não encontrado',
        quantity: item._sum.quantity || 0,
        revenue: item._sum.total || 0,
      };
    });
  }

  private async getPaymentMethodStats(where: any) {
    return this.prisma.sale.groupBy({
      by: ['paymentMethod'],
      where,
      _count: { id: true },
      _sum: { total: true },
    }).then(results => 
      results.map(item => ({
        method: item.paymentMethod,
        count: item._count.id,
        total: item._sum.total || 0,
      }))
    );
  }
}
