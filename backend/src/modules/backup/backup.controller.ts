import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('backup')
@UseGuards(JwtAuthGuard)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post()
  async createBackup() {
    const backupPath = await this.backupService.createBackup();
    return { message: 'Backup criado com sucesso', path: backupPath };
  }

  @Get()
  async listBackups() {
    const backups = await this.backupService.listBackups();
    return { backups };
  }
}
