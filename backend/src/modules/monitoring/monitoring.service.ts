import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private metrics = [];
  private errorCount = 0;
  private requestCount = 0;
  private totalResponseTime = 0;

  @Cron(CronExpression.EVERY_5_MINUTES)
  collectMetrics() {
    const metrics = this.getSystemMetrics();
    this.metrics.push(metrics);
    
    if (this.metrics.length > 288) this.metrics.shift();

    if (metrics.cpu > 80) this.logger.warn(`CPU alta: ${metrics.cpu.toFixed(2)}%`);
    if (metrics.memory.percentage > 85) this.logger.warn(`Memória alta: ${metrics.memory.percentage.toFixed(2)}%`);
    if (metrics.disk.percentage > 90) this.logger.error(`Disco crítico: ${metrics.disk.percentage.toFixed(2)}%`);
  }

  getSystemMetrics() {
    const cpus = os.cpus();
    const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
    const totalTick = cpus.reduce((acc, cpu) => 
      acc + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq, 0);
    const cpu = 100 - (totalIdle / totalTick * 100);

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    let diskUsed = 0;
    let diskTotal = 1;
    if (fs.existsSync(dbPath)) {
      diskUsed = fs.statSync(dbPath).size;
      diskTotal = diskUsed * 10;
    }

    return {
      timestamp: new Date(),
      cpu,
      memory: { used: usedMem, total: totalMem, percentage: (usedMem / totalMem) * 100 },
      disk: { used: diskUsed, total: diskTotal, percentage: (diskUsed / diskTotal) * 100 },
      uptime: os.uptime()
    };
  }

  getMetrics() {
    return {
      system: this.metrics.slice(-12),
      app: {
        errorCount: this.errorCount,
        requestCount: this.requestCount,
        avgResponseTime: this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0
      }
    };
  }

  recordError() { this.errorCount++; }
  recordRequest(responseTime: number) { this.requestCount++; this.totalResponseTime += responseTime; }

  getHealthStatus() {
    const current = this.getSystemMetrics();
    return {
      status: current.cpu < 80 && current.memory.percentage < 85 ? 'healthy' : 'degraded',
      cpu: current.cpu.toFixed(2) + '%',
      memory: current.memory.percentage.toFixed(2) + '%',
      disk: current.disk.percentage.toFixed(2) + '%',
      uptime: Math.floor(current.uptime / 3600) + 'h'
    };
  }
}
