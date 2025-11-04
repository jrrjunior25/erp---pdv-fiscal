import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly storageType = process.env.STORAGE_TYPE || 'local';
  private readonly baseDir = path.join(process.cwd(), 'storage', 'xmls');

  async saveXML(xml: string, nfeKey: string): Promise<string> {
    try {
      if (this.storageType === 'local') {
        return await this.saveLocalXML(xml, nfeKey);
      } else if (this.storageType === 's3') {
        return await this.saveS3XML(xml, nfeKey);
      }
      throw new Error(`Unsupported storage type: ${this.storageType}`);
    } catch (error) {
      this.logger.error(`Error saving XML ${nfeKey}:`, error);
      throw error;
    }
  }

  async getXML(nfeKey: string): Promise<string> {
    try {
      if (this.storageType === 'local') {
        return await this.getLocalXML(nfeKey);
      } else if (this.storageType === 's3') {
        return await this.getS3XML(nfeKey);
      }
      throw new Error(`Unsupported storage type: ${this.storageType}`);
    } catch (error) {
      this.logger.error(`Error retrieving XML ${nfeKey}:`, error);
      throw error;
    }
  }

  private async saveLocalXML(xml: string, nfeKey: string): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const dir = path.join(this.baseDir, String(year), month);

    await fs.mkdir(dir, { recursive: true });

    const filePath = path.join(dir, `${nfeKey}.xml`);
    await fs.writeFile(filePath, xml, 'utf-8');

    this.logger.log(`XML saved locally: ${filePath}`);
    return `local://${year}/${month}/${nfeKey}.xml`;
  }

  private async getLocalXML(nfeKey: string): Promise<string> {
    const parts = nfeKey.split('/');
    const fileName = parts[parts.length - 1];
    const year = parts[parts.length - 3] || new Date().getFullYear();
    const month = parts[parts.length - 2] || String(new Date().getMonth() + 1).padStart(2, '0');

    const filePath = path.join(this.baseDir, String(year), month, fileName);
    return await fs.readFile(filePath, 'utf-8');
  }

  private async saveS3XML(xml: string, nfeKey: string): Promise<string> {
    throw new Error('S3 storage not implemented yet. Install @aws-sdk/client-s3 and implement.');
  }

  private async getS3XML(nfeKey: string): Promise<string> {
    throw new Error('S3 storage not implemented yet. Install @aws-sdk/client-s3 and implement.');
  }
}
