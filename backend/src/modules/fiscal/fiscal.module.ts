import { Module } from '@nestjs/common';
import { FiscalController } from './fiscal.controller';
import { FiscalService } from './fiscal.service';
import { NfceService } from './nfce.service';
import { PixService } from './pix.service';
import { SefazService } from './sefaz.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageService } from '../../common/storage/storage.service';

@Module({
  imports: [PrismaModule],
  controllers: [FiscalController],
  providers: [FiscalService, NfceService, PixService, SefazService, StorageService],
  exports: [FiscalService, NfceService, PixService, SefazService],
})
export class FiscalModule {}
