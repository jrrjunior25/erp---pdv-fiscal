import BaseService from '../baseService';
import type { Product } from '@types';

class ProductService extends BaseService {
  async getAll(): Promise<Product[]> {
    return this.request<Product[]>('/products');
  }

  async create(data: Omit<Product, 'id'>): Promise<Product> {
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update(id: string, data: Partial<Product>): Promise<Product> {
    return this.request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(id: string): Promise<void> {
    return this.request<void>(`/products/${id}`, { method: 'DELETE' });
  }

  async exportExcel(): Promise<void> {
    return super.exportExcel('products');
  }

  async exportTemplate(): Promise<void> {
    return super.exportTemplate('products');
  }

  async importExcel(file: File) {
    return super.importExcel('products', file);
  }
}

export default new ProductService();