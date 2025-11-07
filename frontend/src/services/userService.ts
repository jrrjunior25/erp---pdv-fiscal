import apiClient from './apiClient';

export const userService = {
  getAll: () => apiClient.get('/users'),
  getById: (id: string) => apiClient.get(`/users/${id}`),
  create: (data: any) => apiClient.post('/users', data),
  update: (id: string, data: any) => apiClient.put(`/users/${id}`, data),
  delete: (id: string) => apiClient.delete(`/users/${id}`),
  exportExcel: () => apiClient.download('/users/export/excel'),
  exportTemplate: () => apiClient.download('/users/export/template'),
  importExcel: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/users/import/excel', formData);
  },
};

export default userService;
