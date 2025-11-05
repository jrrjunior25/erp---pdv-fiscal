export interface FiscalConfig {
  cnpj: string;
  name: string;
  fantasyName: string;
  ie: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  pixKey: string;
  pixMerchantName: string;
  pixMerchantCity: string;
  environment: 'homologacao' | 'producao';
  nfceSeries: number;
  certificate?: string;
  certificatePass?: string;
  certExpiresAt?: Date;
}

export interface NfceData {
  number: number;
  series: number;
  items: NfceItem[];
  total: number;
  customerCpf?: string;
  customerName?: string;
}

export interface NfceItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  ncm?: string;
  cfop?: string;
}

export interface PixCharge {
  amount: number;
  qrCode: string;
  txId: string;
  expiresAt: Date;
}

export interface SefazResponse {
  success: boolean;
  protocol?: string;
  message?: string;
  error?: string;
}