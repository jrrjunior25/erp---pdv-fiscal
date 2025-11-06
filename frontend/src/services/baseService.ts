import { ApiResponse, ExcelImportResult } from '@types/api';

class BaseService {
  protected baseURL = '/api';

  protected async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  protected async exportExcel(module: string): Promise<void> {
    window.open(`${this.baseURL}/${module}/export/excel`, '_blank');
  }

  protected async exportTemplate(module: string): Promise<void> {
    window.open(`${this.baseURL}/${module}/export/template`, '_blank');
  }

  protected async importExcel(module: string, file: File): Promise<ExcelImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/${module}/import/excel`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    return response.json();
  }
}

export default BaseService;