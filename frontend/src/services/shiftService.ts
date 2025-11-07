import apiClient from './apiClient';

export const shiftService = {
  getAll: () => apiClient.get('/shifts'),
  getActive: () => apiClient.get('/shifts/active'),
  getById: (id: string) => apiClient.get(`/shifts/${id}`),
  open: (data: any) => apiClient.post('/shifts/open', data),
  close: (id: string, data: any) => apiClient.post(`/shifts/${id}/close`, data),
  getHistory: () => apiClient.get('/shifts/history'),
};

export default shiftService;
