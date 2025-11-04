import apiClient from './apiClient';

export interface QuotationItem {
  productId: string;
  quantity: number;
  price: number;
  discount?: number;
}

export interface CreateQuotationDto {
  customerId?: string;
  sellerId?: string;
  validUntil: string;
  observations?: string;
  items: QuotationItem[];
}

export interface Quotation {
  id: string;
  number: number;
  customerId?: string;
  sellerId?: string;
  total: number;
  discount: number;
  status: string;
  validUntil: Date;
  observations?: string;
  createdAt: Date;
  convertedAt?: Date;
  saleId?: string;
  customer?: any;
  seller?: any;
  items: any[];
}

export const createQuotation = async (data: CreateQuotationDto): Promise<Quotation> => {
  try {
    const response = await apiClient.post<Quotation>('/quotations', data);
    return response;
  } catch (error) {
    console.error('Error creating quotation:', error);
    throw error;
  }
};

export const convertQuotationToSale = async (
  quotationId: string,
  shiftId: string,
  paymentMethod: string
): Promise<any> => {
  try {
    const response = await apiClient.post(`/quotations/${quotationId}/convert`, {
      shiftId,
      paymentMethod,
    });
    return response;
  } catch (error) {
    console.error('Error converting quotation:', error);
    throw error;
  }
};

export const markExpiredQuotations = async (): Promise<any> => {
  try {
    const response = await apiClient.post('/quotations/mark-expired', {});
    return response;
  } catch (error) {
    console.error('Error marking expired quotations:', error);
    throw error;
  }
};

export const getQuotations = async (filters?: {
  status?: string;
  customerId?: string;
  sellerId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Quotation[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.customerId) params.append('customerId', filters.customerId);
    if (filters?.sellerId) params.append('sellerId', filters.sellerId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get<Quotation[]>(`/quotations?${params.toString()}`);
    return response;
  } catch (error) {
    console.error('Error fetching quotations:', error);
    throw error;
  }
};

export const getQuotationById = async (quotationId: string): Promise<Quotation> => {
  try {
    const response = await apiClient.get<Quotation>(`/quotations/${quotationId}`);
    return response;
  } catch (error) {
    console.error('Error fetching quotation:', error);
    throw error;
  }
};

export const updateQuotation = async (
  quotationId: string,
  data: Partial<CreateQuotationDto>
): Promise<Quotation> => {
  try {
    const response = await apiClient.put<Quotation>(`/quotations/${quotationId}`, data);
    return response;
  } catch (error) {
    console.error('Error updating quotation:', error);
    throw error;
  }
};

export const cancelQuotation = async (quotationId: string): Promise<Quotation> => {
  try {
    const response = await apiClient.delete<Quotation>(`/quotations/${quotationId}`);
    return response;
  } catch (error) {
    console.error('Error canceling quotation:', error);
    throw error;
  }
};
