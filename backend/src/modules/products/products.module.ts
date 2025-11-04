import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductEnrichmentService } from './services/product-enrichment.service';
import { ProductExcelService } from './services/product-excel.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductEnrichmentService, ProductExcelService],
  exports: [ProductsService],
})
export class ProductsModule {}
