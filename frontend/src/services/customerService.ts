import apiClient from './apiClient';

export const customerService = {
  getAll: (filters?: any) => apiClient.get('/customers', filters),
  getById: (id: string) => apiClient.get(`/customers/${id}`),
  create: (data: any) => apiClient.post('/customers', data),
  update: (id: string, data: any) => apiClient.put(`/customers/${id}`, data),
  delete: (id: string) => apiClient.delete(`/customers/${id}`),
  getStats: () => apiClient.get('/customers/stats'),
  exportExcel: () => apiClient.download('/customers/export/excel'),
  exportTemplate: () => apiClient.download('/customers/export/template'),
  importExcel: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/customers/import/excel', formData);
  },
};

export default customerService;
