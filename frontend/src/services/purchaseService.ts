import apiClient from './apiClient';

export const purchaseService = {
  getAll: () => apiClient.get('/purchasing'),
  getById: (id: string) => apiClient.get(`/purchasing/${id}`),
  create: (data: any) => apiClient.post('/purchasing', data),
  update: (id: string, data: any) => apiClient.put(`/purchasing/${id}`, data),
  delete: (id: string) => apiClient.delete(`/purchasing/${id}`),
  updateStatus: (id: string, status: string) => 
    apiClient.patch(`/purchasing/${id}/status`, { status }),
};

export default purchaseService;
