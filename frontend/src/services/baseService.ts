import { ApiResponse, ExcelImportResult } from '@types/api';

class BaseService {
  protected baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
      const text = await response.text();
      console.error('Erro na API:', { status: response.status, endpoint, response: text });
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    } else {
      const text = await response.text();
      console.error('Resposta não é JSON:', text.substring(0, 200));
      throw new Error('API retornou HTML em vez de JSON. Verifique a autenticação.');
    }
  }

  protected async exportExcel(module: string): Promise<void> {
    const token = localStorage.getItem('token');
    window.open(`${this.baseURL}/${module}/export/excel?token=${token}`, '_blank');
  }

  protected async exportTemplate(module: string): Promise<void> {
    const token = localStorage.getItem('token');
    window.open(`${this.baseURL}/${module}/export/template?token=${token}`, '_blank');
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