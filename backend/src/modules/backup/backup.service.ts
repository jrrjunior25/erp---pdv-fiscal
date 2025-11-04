import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = path.join(process.cwd(), 'backups');
  private readonly dbPath = path.join(process.cwd(), 'prisma', 'dev.db');

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailyBackup() {
    this.logger.log('Iniciando backup automático diário...');
    try {
      await this.createBackup();
      this.logger.log('Backup automático concluído com sucesso!');
    } catch (error) {
      this.logger.error('Erro ao executar backup automático:', error);
    }
  }

  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFileName = `backup_${timestamp}.db`;
    const backupPath = path.join(this.backupDir, backupFileName);

    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    if (fs.existsSync(this.dbPath)) {
      fs.copyFileSync(this.dbPath, backupPath);
      this.logger.log(`Backup criado: ${backupFileName}`);
      await this.cleanOldBackups();
      return backupPath;
    } else {
      throw new Error('Banco de dados não encontrado');
    }
  }

  private async cleanOldBackups() {
    const files = fs.readdirSync(this.backupDir);
    const backupFiles = files
      .filter(f => f.startsWith('backup_') && f.endsWith('.db'))
      .map(f => ({
        name: f,
        path: path.join(this.backupDir, f),
        time: fs.statSync(path.join(this.backupDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (backupFiles.length > 30) {
      const toDelete = backupFiles.slice(30);
      toDelete.forEach(file => {
        fs.unlinkSync(file.path);
        this.logger.log(`Backup antigo removido: ${file.name}`);
      });
    }
  }

  async listBackups() {
    if (!fs.existsSync(this.backupDir)) {
      return [];
    }
    const files = fs.readdirSync(this.backupDir);
    return files
      .filter(f => f.startsWith('backup_') && f.endsWith('.db'))
      .map(f => ({
        name: f,
        size: fs.statSync(path.join(this.backupDir, f)).size,
        date: fs.statSync(path.join(this.backupDir, f)).mtime
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }
}
