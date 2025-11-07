import apiClient from './apiClient';

export const inventoryService = {
  getAll: () => apiClient.get('/inventory'),
  getAlerts: () => apiClient.get('/inventory/alerts'),
  getMovements: (productId?: string) => 
    apiClient.get(`/inventory/movements${productId ? `?productId=${productId}` : ''}`),
  createMovement: (data: any) => apiClient.post('/inventory/movements', data),
  exportExcel: () => apiClient.download('/inventory/export/excel'),
  exportTemplate: () => apiClient.download('/inventory/export/template'),
  importExcel: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/inventory/import/excel', formData);
  },
};

export default inventoryService;
