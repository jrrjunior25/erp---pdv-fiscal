export interface Quotation {
  id: string;
  number: string;
  customerId: string;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  total: number;
  validUntil: Date;
  items: QuotationItem[];
  createdAt: Date;
}

export interface QuotationItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface QuotationFilters {
  customerId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}