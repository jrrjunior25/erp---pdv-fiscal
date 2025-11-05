import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ProductFilters, ProductStats } from './interfaces/products.interface';
import { PRODUCTS_CONSTANTS } from './constants/products.constants';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private productsCache: any[] = [];
  private cacheExpiry: number = 0;

  constructor(private prisma: PrismaService) {}

  async findAll(filters?: ProductFilters) {
    if (!filters && this.productsCache.length && Date.now() < this.cacheExpiry) {
      return this.productsCache;
    }

    const where = this.buildWhereClause(filters);
    
    const products = await this.prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    if (!filters) {
      this.productsCache = products;
      this.cacheExpiry = Date.now() + PRODUCTS_CONSTANTS.CACHE_TTL;
    }

    return products;
  }

  private buildWhereClause(filters?: ProductFilters) {
    if (!filters) return {};

    return {
      ...(filters.name && { name: { contains: filters.name, mode: 'insensitive' } }),
      ...(filters.category && { category: { contains: filters.category, mode: 'insensitive' } }),
      ...(filters.active !== undefined && { active: filters.active }),
      ...(filters.minPrice && { price: { gte: filters.minPrice } }),
      ...(filters.maxPrice && { price: { lte: filters.maxPrice } }),
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(PRODUCTS_CONSTANTS.VALIDATION_MESSAGES.PRODUCT_NOT_FOUND);
    }

    return product;
  }

  async create(data: CreateProductDto) {
    this.clearCache();
    
    const product = await this.prisma.product.create({
      data,
    });

    this.logger.log(`Produto criado: ${product.name}`);
    return product;
  }

  async update(id: string, data: UpdateProductDto) {
    this.clearCache();
    
    const product = await this.prisma.product.update({
      where: { id },
      data,
    });

    this.logger.log(`Produto atualizado: ${product.name}`);
    return product;
  }

  async remove(id: string) {
    this.clearCache();
    
    const product = await this.prisma.product.delete({
      where: { id },
    });

    this.logger.log(`Produto excluído: ${product.name}`);
    return product;
  }

  async getStats(): Promise<ProductStats> {
    const [total, active, inactive, lowStock, totalValue] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { active: true } }),
      this.prisma.product.count({ where: { active: false } }),
      this.prisma.product.count({ where: { stock: { lte: 5 } } }),
      this.prisma.product.aggregate({ _sum: { price: true } }),
    ]);

    return {
      total,
      active,
      inactive,
      lowStock,
      totalValue: totalValue._sum.price || 0,
    };
  }

  private clearCache() {
    this.productsCache = [];
    this.cacheExpiry = 0;
  }
}
