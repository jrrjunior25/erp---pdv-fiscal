import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StockMovementService } from './services/stock-movement.service';
import { InventoryAlertsService } from './services/inventory-alerts.service';
import { InventoryItem, InventoryReport, StockValuation } from './interfaces/inventory.interface';
import { UpdateStockDto, InventoryCountDto, StockTransferDto, InventoryFiltersDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private stockMovementService: StockMovementService,
    private alertsService: InventoryAlertsService
  ) {}

  async getLevels(filters?: InventoryFiltersDto): Promise<InventoryItem[]> {
    const products = await this.prisma.product.findMany({
      where: {
        active: true,
        ...(filters?.productId && { id: filters.productId }),
        ...(filters?.category && { category: filters.category }),
        // Filtro lowStock será aplicado após a consulta
      },
      select: {
        id: true,
        name: true,
        code: true,
        stock: true,
        minStock: true,
        category: true,
        cost: true,
        updatedAt: true
      },
      orderBy: { name: 'asc' }
    });

    let result = products.map(product => {
      const status: 'ok' | 'low' | 'out' | 'overstock' = product.stock === 0 ? 'out' : 
                    product.stock <= product.minStock ? 'low' : 'ok';
      
      return {
        id: product.id,
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        quantity: product.stock,
        minStock: product.minStock,
        category: product.category || 'Sem categoria',
        lastMovement: product.updatedAt,
        status,
        value: product.stock * (product.cost || 0)
      };
    });

    if (filters?.lowStock) {
      result = result.filter(item => item.status === 'low' || item.status === 'out');
    }

    return result;
  }

  async getMovements(filters?: InventoryFiltersDto) {
    return this.stockMovementService.getMovements({
      productId: filters?.productId,
      dateFrom: filters?.dateFrom,
      dateTo: filters?.dateTo,
      limit: 100
    });
  }

  async updateStock(data: UpdateStockDto, userId: string) {
    await this.stockMovementService.createMovement({
      ...data,
      userId
    });
    
    return { message: 'Estoque atualizado com sucesso' };
  }

  async transferStock(data: StockTransferDto, userId: string) {
    await this.stockMovementService.createMovement({
      productId: data.productId,
      type: 'TRANSFER',
      quantity: data.quantity,
      reason: data.reason || `Transferência: ${data.fromLocation} → ${data.toLocation}`,
      userId,
      location: data.fromLocation
    });
    
    return { message: 'Transferência realizada com sucesso' };
  }

  async getAlerts() {
    return this.alertsService.checkAlerts();
  }

  async getLowStockProducts() {
    return this.alertsService.getLowStockProducts();
  }

  async getInventoryReport(): Promise<InventoryReport> {
    const products = await this.prisma.product.findMany({
      where: { active: true },
      select: { id: true, stock: true, minStock: true, cost: true }
    });

    const alerts = await this.getAlerts();
    const movements = await this.getMovements();

    return {
      totalProducts: products.length,
      totalValue: products.reduce((sum, p) => sum + (p.stock * (p.cost || 0)), 0),
      lowStockItems: products.filter(p => p.stock <= p.minStock && p.minStock > 0).length,
      outOfStockItems: products.filter(p => p.stock === 0).length,
      topMovements: movements.slice(0, 10),
      alerts
    };
  }

  async getStockValuation(): Promise<StockValuation[]> {
    const products = await this.prisma.product.findMany({
      where: { active: true, stock: { gt: 0 } },
      select: {
        id: true,
        name: true,
        stock: true,
        cost: true
      },
      orderBy: { name: 'asc' }
    });

    return products.map(product => ({
      productId: product.id,
      productName: product.name,
      quantity: product.stock,
      unitCost: product.cost || 0,
      totalValue: product.stock * (product.cost || 0)
    }));
  }

  async inventoryCount(data: InventoryCountDto, userId: string) {
    const results = [];
    
    for (const item of data.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true, stock: true }
      });
      
      if (!product) {
        throw new Error(`Produto ${item.productId} não encontrado`);
      }
      
      const difference = item.counted - product.stock;
      
      if (difference !== 0) {
        await this.stockMovementService.createMovement({
          productId: item.productId,
          type: 'ADJUSTMENT',
          quantity: item.counted,
          reason: `Contagem física - Diferença: ${difference}`,
          userId,
          location: item.location
        });
      }
      
      results.push({
        productId: item.productId,
        productName: product.name,
        previousStock: product.stock,
        counted: item.counted,
        difference
      });
    }

    return {
      message: 'Contagem de estoque concluída',
      itemsCounted: data.items.length,
      adjustments: results.filter(r => r.difference !== 0).length,
      date: new Date(),
      results,
      notes: data.notes
    };
  }

  async parseNfe(data: any) {
    // Parse XML without saving to database
    const xml2js = require('xml2js');
    const parser = new xml2js.Parser({ explicitArray: false });
    
    try {
      const xmlData = data.xmlContent || data.file;
      const result = await parser.parseStringPromise(xmlData);
      
      const nfe = result.nfeProc?.NFe?.infNFe || result.NFe?.infNFe;
      if (!nfe) {
        throw new Error('XML inválido ou não é uma NF-e');
      }

      // Extract supplier info
      const emit = nfe.emit;
      const supplier = {
        cnpj: emit.CNPJ || '',
        name: emit.xNome || '',
        fantasyName: emit.xFant || emit.xNome || '',
        email: emit.email || '',
        phone: emit.fone || '',
        address: emit.enderEmit ? `${emit.enderEmit.xLgr}, ${emit.enderEmit.nro} - ${emit.enderEmit.xBairro}, ${emit.enderEmit.xMun}/${emit.enderEmit.UF}` : '',
      };

      // Extract products
      const det = Array.isArray(nfe.det) ? nfe.det : [nfe.det];
      const products = det.map((item: any) => {
        const prod = item.prod;
        return {
          code: prod.cProd || '',
          barcode: prod.cEAN || prod.cEANTrib || '',
          name: prod.xProd || '',
          ncm: prod.NCM || '',
          cfop: prod.CFOP || '',
          unit: prod.uCom || 'UN',
          quantity: parseFloat(prod.qCom) || 0,
          unitPrice: parseFloat(prod.vUnCom) || 0,
          totalPrice: parseFloat(prod.vProd) || 0,
        };
      });

      // Check if supplier exists
      const existingSupplier = await this.prisma.supplier.findUnique({
        where: { document: supplier.cnpj },
      });

      // Check which products already exist
      const productCodes = products.map(p => p.code);
      const existingProducts = await this.prisma.product.findMany({
        where: { code: { in: productCodes } },
        select: { code: true, name: true, id: true },
      });

      const existingProductCodes = new Set(existingProducts.map(p => p.code));
      const productsWithStatus = products.map(p => ({
        ...p,
        exists: existingProductCodes.has(p.code),
        existingProduct: existingProducts.find(ep => ep.code === p.code),
      }));

      return {
        nfeNumber: nfe.ide?.nNF || 'N/A',
        nfeKey: nfe.$?.Id?.replace('NFe', '') || 'N/A',
        issueDate: nfe.ide?.dhEmi || new Date().toISOString(),
        supplier: {
          ...supplier,
          exists: !!existingSupplier,
          existingId: existingSupplier?.id,
        },
        products: productsWithStatus,
        totals: {
          productsCount: products.length,
          newProducts: productsWithStatus.filter(p => !p.exists).length,
          existingProducts: productsWithStatus.filter(p => p.exists).length,
          totalValue: products.reduce((sum, p) => sum + p.totalPrice, 0),
        },
      };
    } catch (error) {
      throw new Error(`Erro ao processar XML: ${error.message}`);
    }
  }

  async confirmNfe(data: any) {
    const { parsedData } = data;
    
    console.log('[NFe Import] Starting confirmation');
    
    try {
      // 1. Create or get supplier
      let supplier;
      if (parsedData.supplier.exists) {
        console.log('[NFe Import] Using existing supplier');
        supplier = await this.prisma.supplier.findUnique({
          where: { id: parsedData.supplier.existingId },
        });
      } else {
        console.log('[NFe Import] Creating new supplier');
        supplier = await this.prisma.supplier.create({
          data: {
            name: parsedData.supplier.name,
            document: parsedData.supplier.cnpj,
            email: parsedData.supplier.email || null,
            phone: parsedData.supplier.phone || null,
            address: parsedData.supplier.address || null,
          },
        });
        console.log('[NFe Import] Supplier created');
      }

      // 2. Create or update products and add stock
      const productsProcessed = [];
      const purchaseItems = [];
      let newProductsCreated = 0;
      let stockEntries = 0;

      console.log('[NFe Import] Processing products');

      for (const productData of parsedData.products) {
        console.log('[NFe Import] Processing product');
        let product;
        
        if (productData.exists) {
          // Product exists, just update stock
          console.log('[NFe Import] Product exists, updating stock');
          product = await this.prisma.product.findUnique({
            where: { code: productData.code },
          });
          
          if (product) {
            await this.prisma.product.update({
              where: { id: product.id },
              data: {
                stock: { increment: productData.quantity },
              },
            });
            console.log('[NFe Import] Stock updated');
          }
        } else {
          // Create new product
          console.log('[NFe Import] Creating new product');
          product = await this.prisma.product.create({
            data: {
              code: productData.code,
              barcode: productData.barcode || null,
              name: productData.name,
              price: productData.unitPrice * 1.3, // 30% markup as default
              cost: productData.unitPrice,
              stock: productData.quantity,
              category: 'Importado NF-e',
            },
          });
          console.log('[NFe Import] Product created');
          newProductsCreated++;
        }

        if (product) {
          productsProcessed.push({
            code: productData.code,
            name: productData.name,
            quantity: productData.quantity,
            isNew: !productData.exists,
          });
          
          purchaseItems.push({
            productId: product.id,
            quantity: productData.quantity,
            cost: productData.unitPrice,
            total: productData.totalPrice,
          });
          
          stockEntries++;
        }
      }

      console.log('[NFe Import] Products processed');

      // 3. Create purchase record with items
      console.log('[NFe Import] Creating purchase record');
      const lastPurchase = await this.prisma.purchase.findFirst({
        orderBy: { number: 'desc' },
      });
      const nextNumber = (lastPurchase?.number || 0) + 1;

      const purchase = await this.prisma.purchase.create({
        data: {
          number: nextNumber,
          supplierId: supplier.id,
          total: parsedData.totals.totalValue,
          status: 'Recebido',
          nfeKey: parsedData.nfeKey,
          items: {
            create: purchaseItems,
          },
        },
        include: {
          items: true,
        },
      });
      
      console.log('[NFe Import] Purchase created');

      const result = {
        summary: {
          invoiceNumber: parsedData.nfeNumber,
          supplierFound: parsedData.supplier.exists,
          supplierCreated: !parsedData.supplier.exists,
          productsProcessed: productsProcessed.length,
          newProductsCreated,
          stockEntries,
        },
        details: {
          supplierName: parsedData.supplier.name,
          products: productsProcessed,
        },
      };
      
      console.log('[NFe Import] Confirmation completed successfully');
      return result;
    } catch (error) {
      console.error('[NFe Import] Error during confirmation:', error);
      throw new Error(`Erro ao confirmar importação: ${error.message}`);
    }
  }

  async importNfe(data: any) {
    // Simplified NFe import
    // In a real scenario, you'd parse XML and extract product data
    return {
      message: 'NFe import completed',
      productsImported: 0,
      nfeKey: data.nfeKey || 'N/A',
    };
  }

  async getAnalytics(period: string) {
    const days = parseInt(period.replace('d', '')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const movements = await this.prisma.stockMovement.findMany({
      where: { createdAt: { gte: startDate } },
      include: { product: true }
    });

    const products = await this.prisma.product.findMany({
      where: { active: true },
      select: { id: true, name: true, stock: true, cost: true, category: true }
    });

    return {
      period: `${days} dias`,
      totalValue: products.reduce((sum, p) => sum + (p.stock * (p.cost || 0)), 0),
      totalMovements: movements.length,
      entriesCount: movements.filter(m => m.type === 'IN').length,
      exitsCount: movements.filter(m => m.type === 'OUT').length,
      adjustmentsCount: movements.filter(m => m.type === 'ADJUSTMENT').length,
      lowStockCount: products.filter(p => p.stock <= (p as any).minStock).length,
      categories: this.groupByCategory(products)
    };
  }

  async getStockByCategory() {
    const products = await this.prisma.product.findMany({
      where: { active: true },
      select: { category: true, stock: true, cost: true }
    });

    const grouped = products.reduce((acc, p) => {
      const cat = p.category || 'Sem categoria';
      if (!acc[cat]) {
        acc[cat] = { category: cat, quantity: 0, value: 0, products: 0 };
      }
      acc[cat].quantity += p.stock;
      acc[cat].value += p.stock * (p.cost || 0);
      acc[cat].products += 1;
      return acc;
    }, {});

    return Object.values(grouped);
  }

  async getStockBySupplier() {
    const products = await this.prisma.product.findMany({
      where: { active: true, supplierId: { not: null } },
      include: { supplier: true }
    });

    const grouped = products.reduce((acc, p) => {
      const supplierId = p.supplierId;
      if (!supplierId) return acc;
      
      if (!acc[supplierId]) {
        acc[supplierId] = {
          supplierId,
          supplierName: p.supplier?.name || 'N/A',
          quantity: 0,
          value: 0,
          products: 0
        };
      }
      acc[supplierId].quantity += p.stock;
      acc[supplierId].value += p.stock * (p.cost || 0);
      acc[supplierId].products += 1;
      return acc;
    }, {});

    return Object.values(grouped);
  }

  private groupByCategory(products: any[]) {
    const grouped = products.reduce((acc, p) => {
      const cat = p.category || 'Sem categoria';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    return grouped;
  }
}
