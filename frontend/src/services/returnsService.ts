import apiClient from './apiClient';

export interface SaleReturnItem {
  saleItemId: string;
  productId: string;
  quantity: number;
  price: number;
  reason?: string;
}

export interface CreateReturnDto {
  saleId: string;
  type: 'DEVOLUCAO' | 'TROCA';
  reason: string;
  refundMethod: string;
  observations?: string;
  items: SaleReturnItem[];
}

export interface SaleReturn {
  id: string;
  number: number;
  saleId: string;
  type: string;
  reason: string;
  total: number;
  refundMethod: string;
  status: string;
  createdAt: Date;
  processedAt?: Date;
  processedBy?: string;
  observations?: string;
  items: any[];
  sale?: any;
}

export const createReturn = async (data: CreateReturnDto): Promise<SaleReturn> => {
  try {
    const response = await apiClient.post<SaleReturn>('/returns', data);
    return response;
  } catch (error) {
    console.error('Error creating return:', error);
    throw error;
  }
};

export const processReturn = async (returnId: string): Promise<SaleReturn> => {
  try {
    const response = await apiClient.post<SaleReturn>(`/returns/${returnId}/process`, {});
    return response;
  } catch (error) {
    console.error('Error processing return:', error);
    throw error;
  }
};

export const cancelReturn = async (returnId: string): Promise<SaleReturn> => {
  try {
    const response = await apiClient.post<SaleReturn>(`/returns/${returnId}/cancel`, {});
    return response;
  } catch (error) {
    console.error('Error canceling return:', error);
    throw error;
  }
};

export const getReturns = async (filters?: {
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}): Promise<SaleReturn[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get<SaleReturn[]>(`/returns?${params.toString()}`);
    return response;
  } catch (error) {
    console.error('Error fetching returns:', error);
    throw error;
  }
};

export const getReturnById = async (returnId: string): Promise<SaleReturn> => {
  try {
    const response = await apiClient.get<SaleReturn>(`/returns/${returnId}`);
    return response;
  } catch (error) {
    console.error('Error fetching return:', error);
    throw error;
  }
};

export const getReturnsBySale = async (saleId: string): Promise<SaleReturn[]> => {
  try {
    const response = await apiClient.get<SaleReturn[]>(`/returns/sale/${saleId}`);
    return response;
  } catch (error) {
    console.error('Error fetching returns by sale:', error);
    throw error;
  }
};
