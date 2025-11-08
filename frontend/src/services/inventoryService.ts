import apiClient from './apiClient';

export const inventoryService = {
  getLevels: (filters?: any) => apiClient.get('/inventory/levels', filters),
  getMovements: (filters?: any) => apiClient.get('/inventory/movements', filters),
  getAlerts: () => apiClient.get('/inventory/alerts'),
  getLowStock: () => apiClient.get('/inventory/low-stock'),
  getReport: () => apiClient.get('/inventory/report'),
  getValuation: () => apiClient.get('/inventory/valuation'),
  getAnalytics: (period?: string) => apiClient.get(`/inventory/analytics${period ? `?period=${period}` : ''}`),
  getByCategory: () => apiClient.get('/inventory/by-category'),
  getBySupplier: () => apiClient.get('/inventory/by-supplier'),
  updateStock: (data: any) => apiClient.post('/inventory/update-stock', data),
  transfer: (data: any) => apiClient.post('/inventory/transfer', data),
  count: (data: any) => apiClient.post('/inventory/count', data),
  exportExcel: () => apiClient.download('/inventory/export/excel'),
  exportTemplate: () => apiClient.download('/inventory/export/template'),
  importNfe: (data: any) => apiClient.post('/inventory/import-nfe', data),
};

export default inventoryService;
