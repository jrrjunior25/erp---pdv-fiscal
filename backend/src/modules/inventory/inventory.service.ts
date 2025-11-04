import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getLevels() {
    const products = await this.prisma.product.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        stock: true,
        minStock: true,
        category: true,
      },
    });

    return products.map(product => ({
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      quantity: product.stock,
      currentStock: product.stock,
      minStock: product.minStock,
      category: product.category || 'Sem categoria',
      status: product.stock <= product.minStock ? 'low' : 'ok',
    }));
  }

  async getMovements() {
    // Retorna movimentações de estoque baseadas em vendas e compras
    const sales = await this.prisma.saleItem.findMany({
      include: {
        product: true,
        sale: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const purchases = await this.prisma.purchaseItem.findMany({
      include: {
        product: true,
        purchase: {
          include: {
            supplier: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const saleMovements = sales.map(item => ({
      id: `sale-${item.id}`,
      productId: item.productId,
      productName: item.product.name,
      type: 'Venda',
      quantityChange: -item.quantity,
      timestamp: item.createdAt.toISOString(),
      reason: `Venda #${item.sale.number}`,
    }));

    const purchaseMovements = purchases.map(item => ({
      id: `purchase-${item.id}`,
      productId: item.productId,
      productName: item.product.name,
      type: item.purchase.nfeKey ? 'Entrada (NF-e)' : 'Entrada (Compra)',
      quantityChange: item.quantity,
      timestamp: item.createdAt.toISOString(),
      reason: `Compra #${item.purchase.number} - ${item.purchase.supplier.name}`,
    }));

    // Combine and sort by timestamp
    const allMovements = [...saleMovements, ...purchaseMovements];
    allMovements.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return allMovements.slice(0, 100);
  }

  async inventoryCount(counts: any[]) {
    // Update stock based on physical count
    for (const count of counts) {
      await this.prisma.product.update({
        where: { id: count.productId },
        data: {
          stock: count.counted,
        },
      });
    }

    return {
      message: 'Inventory count completed',
      itemsCounted: counts.length,
      date: new Date(),
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
    
    console.log('[NFe Import] Starting confirmation with data:', JSON.stringify(parsedData, null, 2));
    
    try {
      // 1. Create or get supplier
      let supplier;
      if (parsedData.supplier.exists) {
        console.log('[NFe Import] Using existing supplier:', parsedData.supplier.existingId);
        supplier = await this.prisma.supplier.findUnique({
          where: { id: parsedData.supplier.existingId },
        });
      } else {
        console.log('[NFe Import] Creating new supplier:', parsedData.supplier.name);
        supplier = await this.prisma.supplier.create({
          data: {
            name: parsedData.supplier.name,
            document: parsedData.supplier.cnpj,
            email: parsedData.supplier.email || null,
            phone: parsedData.supplier.phone || null,
            address: parsedData.supplier.address || null,
          },
        });
        console.log('[NFe Import] Supplier created with ID:', supplier.id);
      }

      // 2. Create or update products and add stock
      const productsProcessed = [];
      const purchaseItems = [];
      let newProductsCreated = 0;
      let stockEntries = 0;

      console.log('[NFe Import] Processing', parsedData.products.length, 'products');

      for (const productData of parsedData.products) {
        console.log('[NFe Import] Processing product:', productData.code, productData.name);
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
            console.log('[NFe Import] Stock updated for product:', product.id, 'new stock:', product.stock + productData.quantity);
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
          console.log('[NFe Import] Product created with ID:', product.id);
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

      console.log('[NFe Import] Products processed:', productsProcessed.length);

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
      
      console.log('[NFe Import] Purchase created with ID:', purchase.id, 'with', purchase.items.length, 'items');

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
      
      console.log('[NFe Import] Confirmation completed successfully:', JSON.stringify(result, null, 2));
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
}
