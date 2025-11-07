import { Module } from '@nestjs/common';
import { FiscalController } from './fiscal.controller';
import { FiscalService } from './fiscal.service';
import { NfceService } from './nfce.service';
import { NfeService } from './nfe.service';
import { PixService } from './pix.service';
import { SefazService } from './sefaz.service';
import { PdfService } from './pdf.service';
import { DanfeService } from './danfe.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageService } from '../../common/storage/storage.service';

@Module({
  imports: [PrismaModule],
  controllers: [FiscalController],
  providers: [FiscalService, NfceService, NfeService, PixService, SefazService, PdfService, DanfeService, StorageService],
  exports: [FiscalService, NfceService, NfeService, PixService, SefazService, PdfService, DanfeService],
})
export class FiscalModule {}
