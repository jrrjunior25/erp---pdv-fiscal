import apiClient from './apiClient';

export const supplierService = {
  getAll: () => apiClient.get('/suppliers'),
  getById: (id: string) => apiClient.get(`/suppliers/${id}`),
  create: (data: any) => apiClient.post('/suppliers', data),
  update: (id: string, data: any) => apiClient.put(`/suppliers/${id}`, data),
  delete: (id: string) => apiClient.delete(`/suppliers/${id}`),
  exportExcel: () => apiClient.download('/suppliers/export/excel'),
  exportTemplate: () => apiClient.download('/suppliers/export/template'),
  importExcel: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/suppliers/import/excel', formData);
  },
};

export default supplierService;
