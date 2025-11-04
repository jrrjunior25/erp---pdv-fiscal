import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

interface PixChargeData {
  amount: number;
  merchantName: string;
  merchantCity: string;
  pixKey: string;
  description?: string;
  txId?: string;
}

interface PixCharge {
  qrCode: string; // EMV code (BR Code)
  txId: string;
  amount: number;
  expiresAt: Date;
}

@Injectable()
export class PixService {
  private readonly logger = new Logger(PixService.name);

  /**
   * Gera uma cobrança PIX com QR Code (BR Code)
   */
  async generatePixCharge(data: PixChargeData): Promise<PixCharge> {
    this.logger.log(`Gerando cobrança PIX no valor de R$ ${data.amount}`);

    const txId = data.txId || this.generateTxId();
    const qrCode = this.generateBRCode(data);

    // Expira em 30 minutos
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    return {
      qrCode,
      txId,
      amount: data.amount,
      expiresAt,
    };
  }

  /**
   * Gera o BR Code (EMV) conforme padrão PIX
   */
  private generateBRCode(data: PixChargeData): string {
    // Payload Format Indicator
    const payload = this.buildTLV('00', '01');

    // Merchant Account Information
    const merchantAccount = this.buildMerchantAccountInfo(data.pixKey);
    const merchantTLV = this.buildTLV('26', merchantAccount);

    // Merchant Category Code (Retail)
    const mcc = this.buildTLV('52', '0000');

    // Transaction Currency (BRL)
    const currency = this.buildTLV('53', '986');

    // Transaction Amount
    const amount = this.buildTLV('54', data.amount.toFixed(2));

    // Country Code
    const country = this.buildTLV('58', 'BR');

    // Merchant Name
    const merchantName = this.buildTLV('59', this.normalizeString(data.merchantName).substring(0, 25));

    // Merchant City
    const merchantCity = this.buildTLV('60', this.normalizeString(data.merchantCity).substring(0, 15));

    // Additional Data
    let additionalData = '';
    if (data.txId) {
      additionalData = this.buildTLV('05', data.txId.substring(0, 25));
    }
    const additionalTLV = additionalData ? this.buildTLV('62', additionalData) : '';

    // Concatenar todos os campos
    const brCodeWithoutCRC = payload + merchantTLV + mcc + currency + amount + country + merchantName + merchantCity + additionalTLV + '6304';

    // Calcular CRC16
    const crc = this.calculateCRC16(brCodeWithoutCRC);

    return brCodeWithoutCRC + crc;
  }

  /**
   * Constrói Merchant Account Information para chave PIX
   */
  private buildMerchantAccountInfo(pixKey: string): string {
    // GUI do PIX
    const gui = this.buildTLV('00', 'br.gov.bcb.pix');
    
    // Chave PIX
    const key = this.buildTLV('01', pixKey);

    return gui + key;
  }

  /**
   * Constrói campo TLV (Tag-Length-Value)
   */
  private buildTLV(tag: string, value: string): string {
    const length = value.length.toString().padStart(2, '0');
    return tag + length + value;
  }

  /**
   * Calcula CRC16-CCITT para BR Code
   */
  private calculateCRC16(payload: string): string {
    let crc = 0xFFFF;
    const polynomial = 0x1021;

    for (let i = 0; i < payload.length; i++) {
      const byte = payload.charCodeAt(i);
      crc ^= (byte << 8);

      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ polynomial) & 0xFFFF;
        } else {
          crc = (crc << 1) & 0xFFFF;
        }
      }
    }

    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  /**
   * Normaliza string removendo acentos e caracteres especiais
   */
  private normalizeString(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '');
  }

  /**
   * Gera ID de transação único
   */
  private generateTxId(): string {
    return crypto.randomBytes(16).toString('hex').substring(0, 25);
  }

  /**
   * Valida BR Code PIX
   */
  validateBRCode(brCode: string): boolean {
    try {
      // Verificações básicas
      if (!brCode || brCode.length < 50) {
        return false;
      }

      // Deve começar com o Payload Format Indicator
      if (!brCode.startsWith('000201')) {
        return false;
      }

      // Deve terminar com 6304 + CRC
      if (!brCode.includes('6304')) {
        return false;
      }

      // Validar CRC
      const crcPosition = brCode.indexOf('6304');
      const brCodeWithoutCRC = brCode.substring(0, crcPosition + 4);
      const receivedCRC = brCode.substring(crcPosition + 4, crcPosition + 8);
      const calculatedCRC = this.calculateCRC16(brCodeWithoutCRC);

      return receivedCRC === calculatedCRC;
    } catch (error) {
      this.logger.error('Erro ao validar BR Code', error);
      return false;
    }
  }

  /**
   * Decodifica BR Code PIX para informações legíveis
   */
  decodeBRCode(brCode: string): any {
    try {
      const info: any = {};
      let position = 0;

      while (position < brCode.length - 8) {
        const tag = brCode.substring(position, position + 2);
        const length = parseInt(brCode.substring(position + 2, position + 4));
        const value = brCode.substring(position + 4, position + 4 + length);

        switch (tag) {
          case '54':
            info.amount = parseFloat(value);
            break;
          case '59':
            info.merchantName = value;
            break;
          case '60':
            info.merchantCity = value;
            break;
        }

        position += 4 + length;
      }

      return info;
    } catch (error) {
      this.logger.error('Erro ao decodificar BR Code', error);
      return null;
    }
  }
}
