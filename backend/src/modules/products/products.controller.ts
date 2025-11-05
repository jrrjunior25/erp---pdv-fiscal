import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UploadedFile, UseInterceptors, Res, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ProductEnrichmentService } from './services/product-enrichment.service';
import { ProductExcelService } from './services/product-excel.service';
import { PRODUCTS_CONSTANTS } from './constants/products.constants';
import { ProductFilters } from './interfaces/products.interface';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly enrichmentService: ProductEnrichmentService,
    private readonly excelService: ProductExcelService,
  ) {}

  // Endpoints de importação/exportação Excel (devem vir ANTES das rotas com :id)



  @Get('export/excel')
  @UseGuards(JwtAuthGuard)
  async exportExcel(@Res() res: Response) {
    try {
      const buffer = await this.excelService.exportToExcel();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="produtos_${new Date().toISOString().split('T')[0]}.xlsx"`);
      res.setHeader('Content-Length', buffer.length);
      
      res.end(buffer);
    } catch (error) {
      console.error('[ProductsController] Erro ao exportar Excel:', error);
      res.status(500).json({ message: 'Erro ao exportar produtos', error: error.message });
    }
  }

  @Get('export/template')
  @UseGuards(JwtAuthGuard)
  async exportTemplate(@Res() res: Response) {
    try {
      const buffer = await this.excelService.exportTemplate();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="modelo_importacao_produtos.xlsx"');
      res.setHeader('Content-Length', buffer.length);
      
      res.end(buffer);
    } catch (error) {
      console.error('[ProductsController] Erro ao exportar template:', error);
      res.status(500).json({ message: 'Erro ao exportar template', error: error.message });
    }
  }

  @Post('import/excel')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('Nenhum arquivo foi enviado');
    }

    return this.excelService.importFromExcel(file.buffer);
  }

  // Endpoints de enriquecimento de dados (devem vir ANTES das rotas com :id)

  @Get('enrich/barcode/:barcode')
  @UseGuards(JwtAuthGuard)
  async enrichByBarcode(@Param('barcode') barcode: string) {
    return this.enrichmentService.searchByBarcode(barcode);
  }

  @Get('enrich/ncm')
  @UseGuards(JwtAuthGuard)
  async searchNCM(@Query('q') query: string) {
    return this.enrichmentService.searchNCM(query);
  }

  @Post('enrich/fiscal')
  @UseGuards(JwtAuthGuard)
  async enrichFiscalData(@Body() body: { description: string; category?: string }) {
    return this.enrichmentService.suggestFiscalDataByDescription(
      body.description,
      body.category,
    );
  }

  @Post('enrich/complete')
  @UseGuards(JwtAuthGuard)
  async enrichComplete(@Body() body: { barcode?: string; name?: string; category?: string }) {
    return this.enrichmentService.enrichProductData(body);
  }

  // Endpoints CRUD padrão

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() filters: ProductFilters) {
    try {
      return await this.productsService.findAll(filters);
    } catch (error) {
      throw new HttpException(PRODUCTS_CONSTANTS.ERROR_MESSAGES.FETCH_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats() {
    try {
      return await this.productsService.getStats();
    } catch (error) {
      throw new HttpException(PRODUCTS_CONSTANTS.ERROR_MESSAGES.FETCH_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    try {
      return await this.productsService.findOne(id);
    } catch (error) {
      throw new HttpException(PRODUCTS_CONSTANTS.ERROR_MESSAGES.FETCH_ERROR, HttpStatus.NOT_FOUND);
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createProductDto: CreateProductDto) {
    try {
      return await this.productsService.create(createProductDto);
    } catch (error) {
      throw new HttpException(PRODUCTS_CONSTANTS.ERROR_MESSAGES.CREATE_ERROR, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    try {
      return await this.productsService.update(id, updateProductDto);
    } catch (error) {
      throw new HttpException(PRODUCTS_CONSTANTS.ERROR_MESSAGES.UPDATE_ERROR, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    try {
      return await this.productsService.remove(id);
    } catch (error) {
      throw new HttpException(PRODUCTS_CONSTANTS.ERROR_MESSAGES.DELETE_ERROR, HttpStatus.BAD_REQUEST);
    }
  }
}
