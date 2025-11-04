import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UploadedFile, UseInterceptors, Res, StreamableFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ProductEnrichmentService } from './services/product-enrichment.service';
import { ProductExcelService } from './services/product-excel.service';

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
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
