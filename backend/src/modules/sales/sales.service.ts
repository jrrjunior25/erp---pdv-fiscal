import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FiscalService } from '../fiscal/fiscal.service';
import { CommissionsService } from '../commissions/commissions.service';
import { CreateSaleDto, UpdateSaleDto } from './dto/sale.dto';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private prisma: PrismaService,
    private fiscalService: FiscalService,
    private commissionsService: CommissionsService,
  ) {}

  async findAll() {
    return this.prisma.sale.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getHistory() {
    return this.prisma.sale.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async findOne(id: string) {
    return this.prisma.sale.findUnique({
      where: { id },
    });
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

    // Validate required fields
    if (!saleData.shiftId) {
      throw new Error('shiftId is required');
    }
    if (!saleData.items || saleData.items.length === 0) {
      throw new Error('items are required');
    }
    if (!saleData.paymentMethod) {
      throw new Error('paymentMethod is required');
    }

    // Validate all items have productId
    for (const item of saleData.items) {
      if (!item.productId) {
        this.logger.error('Item missing productId:', item);
        throw new Error('All items must have a productId');
      }
    }

    // Get the next sale number
    const lastSale = await this.prisma.sale.findFirst({
      orderBy: { number: 'desc' },
    });
    const nextNumber = (lastSale?.number || 0) + 1;

    // Create sale with items
    const sale = await this.prisma.sale.create({
      data: {
        number: nextNumber,
        customerId: saleData.customerId || null,
        shiftId: saleData.shiftId,
        total: saleData.total,
        discount: saleData.discount || 0,
        paymentMethod: saleData.paymentMethod,
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
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
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
    if (saleData.customerId && saleData.loyaltyPointsEarned) {
      await this.prisma.customer.update({
        where: { id: saleData.customerId },
        data: {
          loyaltyPoints: {
            increment: saleData.loyaltyPointsEarned,
          },
        },
      });
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
}
