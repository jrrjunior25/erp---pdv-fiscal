import apiClient from './apiClient';

export interface Commission {
  id: string;
  saleId: string;
  sellerId: string;
  saleTotal: number;
  commissionRate: number;
  commissionValue: number;
  status: string;
  paidAt?: Date;
  createdAt: Date;
  seller?: any;
  sale?: any;
}

export interface CommissionReport {
  seller: any;
  totalSales: number;
  totalSalesValue: number;
  totalCommissionValue: number;
  pendingCommissionValue: number;
  paidCommissionValue: number;
  commissions: Commission[];
}

export const createCommission = async (saleId: string, sellerId: string): Promise<Commission> => {
  try {
    const response = await apiClient.post<Commission>('/commissions', { saleId, sellerId });
    return response;
  } catch (error) {
    console.error('Error creating commission:', error);
    throw error;
  }
};

export const payCommission = async (commissionId: string): Promise<Commission> => {
  try {
    const response = await apiClient.post<Commission>(`/commissions/${commissionId}/pay`, {});
    return response;
  } catch (error) {
    console.error('Error paying commission:', error);
    throw error;
  }
};

export const payMultipleCommissions = async (commissionIds: string[]): Promise<any> => {
  try {
    const response = await apiClient.post('/commissions/pay-multiple', { commissionIds });
    return response;
  } catch (error) {
    console.error('Error paying multiple commissions:', error);
    throw error;
  }
};

export const getCommissions = async (filters?: {
  sellerId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Commission[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.sellerId) params.append('sellerId', filters.sellerId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get<Commission[]>(`/commissions?${params.toString()}`);
    return response;
  } catch (error) {
    console.error('Error fetching commissions:', error);
    throw error;
  }
};

export const getCommissionReport = async (filters?: {
  sellerId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<CommissionReport[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.sellerId) params.append('sellerId', filters.sellerId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get<CommissionReport[]>(`/commissions/report?${params.toString()}`);
    return response;
  } catch (error) {
    console.error('Error fetching commission report:', error);
    throw error;
  }
};

export const getPendingCommissionsBySeller = async (sellerId: string): Promise<any> => {
  try {
    const response = await apiClient.get(`/commissions/seller/${sellerId}/pending`);
    return response;
  } catch (error) {
    console.error('Error fetching pending commissions:', error);
    throw error;
  }
};

export const getCommissionById = async (commissionId: string): Promise<Commission> => {
  try {
    const response = await apiClient.get<Commission>(`/commissions/${commissionId}`);
    return response;
  } catch (error) {
    console.error('Error fetching commission:', error);
    throw error;
  }
};
