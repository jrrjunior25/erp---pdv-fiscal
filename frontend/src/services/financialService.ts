import apiClient from './apiClient';

export const financialService = {
  getAll: () => apiClient.get('/financials'),
  create: (data: any) => apiClient.post('/financials', data),
  settleDebt: (customerId: string) => apiClient.post(`/financials/settle-debt/${customerId}`),
  updateStatus: (transactionId: string, status: string) => 
    apiClient.patch(`/financials/transactions/${transactionId}/status`, { status }),
  exportExcel: () => apiClient.download('/financials/export/excel'),
  exportTemplate: () => apiClient.download('/financials/export/template'),
  importExcel: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/financials/import/excel', formData);
  },
};

export default financialService;
