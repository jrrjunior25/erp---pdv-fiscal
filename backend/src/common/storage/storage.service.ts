import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly storageType = process.env.STORAGE_TYPE || 'local';
  private readonly xmlBaseDir = path.join(process.cwd(), 'storage', 'xmls');
  private readonly pdfBaseDir = path.join(process.cwd(), 'storage', 'pdfs');

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
    const sanitizedKey = path.basename(nfeKey).replace(/[^a-zA-Z0-9_-]/g, '');
    if (!sanitizedKey) {
      throw new BadRequestException('Invalid NFe key');
    }

    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const dir = path.join(this.xmlBaseDir, String(year), month);

    await fs.mkdir(dir, { recursive: true });

    const filePath = path.join(dir, `${sanitizedKey}.xml`);
    const resolvedPath = path.resolve(filePath);
    
    if (!resolvedPath.startsWith(path.resolve(this.xmlBaseDir))) {
      throw new BadRequestException('Invalid file path');
    }

    await fs.writeFile(resolvedPath, xml, 'utf-8');

    this.logger.log('XML saved locally');
    return `local://${year}/${month}/${sanitizedKey}.xml`;
  }

  private async getLocalXML(nfeKey: string): Promise<string> {
    const parts = nfeKey.split('/');
    const fileName = path.basename(parts[parts.length - 1]).replace(/[^a-zA-Z0-9_.-]/g, '');
    if (!fileName) {
      throw new BadRequestException('Invalid NFe key');
    }

    const year = parts[parts.length - 3] || new Date().getFullYear();
    const month = parts[parts.length - 2] || String(new Date().getMonth() + 1).padStart(2, '0');

    const filePath = path.join(this.xmlBaseDir, String(year), month, fileName);
    const resolvedPath = path.resolve(filePath);
    
    if (!resolvedPath.startsWith(path.resolve(this.xmlBaseDir))) {
      throw new BadRequestException('Invalid file path');
    }

    return await fs.readFile(resolvedPath, 'utf-8');
  }

  async savePDF(pdfBuffer: Buffer, nfeKey: string, date: Date): Promise<string> {
    try {
      if (this.storageType === 'local') {
        return await this.saveLocalPDF(pdfBuffer, nfeKey, date);
      } else if (this.storageType === 's3') {
        return await this.saveS3PDF(pdfBuffer, nfeKey, date);
      }
      throw new Error(`Unsupported storage type: ${this.storageType}`);
    } catch (error) {
      this.logger.error(`Error saving PDF ${nfeKey}:`, error);
      throw error;
    }
  }

  async getPDF(nfeKey: string, date: Date): Promise<Buffer> {
    try {
      if (this.storageType === 'local') {
        return await this.getLocalPDF(nfeKey, date);
      } else if (this.storageType === 's3') {
        return await this.getS3PDF(nfeKey, date);
      }
      throw new Error(`Unsupported storage type: ${this.storageType}`);
    } catch (error) {
      this.logger.error(`Error retrieving PDF ${nfeKey}:`, error);
      throw error;
    }
  }

  private async saveLocalPDF(pdfBuffer: Buffer, nfeKey: string, date: Date): Promise<string> {
    const sanitizedKey = path.basename(nfeKey).replace(/[^a-zA-Z0-9_-]/g, '');
    if (!sanitizedKey) {
      throw new BadRequestException('Invalid NFe key');
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dir = path.join(this.pdfBaseDir, String(year), month, day);

    await fs.mkdir(dir, { recursive: true });

    const filePath = path.join(dir, `${sanitizedKey}.pdf`);
    const resolvedPath = path.resolve(filePath);
    
    if (!resolvedPath.startsWith(path.resolve(this.pdfBaseDir))) {
      throw new BadRequestException('Invalid file path');
    }

    await fs.writeFile(resolvedPath, pdfBuffer);

    this.logger.log('PDF saved locally');
    return `local://${year}/${month}/${day}/${sanitizedKey}.pdf`;
  }

  private async getLocalPDF(nfeKey: string, date: Date): Promise<Buffer> {
    const sanitizedKey = path.basename(nfeKey).replace(/[^a-zA-Z0-9_-]/g, '');
    if (!sanitizedKey) {
      throw new BadRequestException('Invalid NFe key');
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const filePath = path.join(this.pdfBaseDir, String(year), month, day, `${sanitizedKey}.pdf`);
    const resolvedPath = path.resolve(filePath);
    
    if (!resolvedPath.startsWith(path.resolve(this.pdfBaseDir))) {
      throw new BadRequestException('Invalid file path');
    }

    return await fs.readFile(resolvedPath);
  }

  private async saveS3XML(xml: string, nfeKey: string): Promise<string> {
    throw new Error('S3 storage not implemented yet. Install @aws-sdk/client-s3 and implement.');
  }

  private async getS3XML(nfeKey: string): Promise<string> {
    throw new Error('S3 storage not implemented yet. Install @aws-sdk/client-s3 and implement.');
  }

  private async saveS3PDF(pdfBuffer: Buffer, nfeKey: string, date: Date): Promise<string> {
    throw new Error('S3 storage not implemented yet. Install @aws-sdk/client-s3 and implement.');
  }

  private async getS3PDF(nfeKey: string, date: Date): Promise<Buffer> {
    throw new Error('S3 storage not implemented yet. Install @aws-sdk/client-s3 and implement.');
  }
}
