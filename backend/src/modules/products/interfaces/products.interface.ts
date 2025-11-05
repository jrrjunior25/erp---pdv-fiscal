export interface Product {
  id: string;
  name: string;
  barcode?: string;
  price: number;
  cost?: number;
  stock?: number;
  category?: string;
  description?: string;
  ncm?: string;
  cfop?: string;
  cst?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFilters {
  name?: string;
  category?: string;
  active?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface ProductStats {
  total: number;
  active: number;
  inactive: number;
  lowStock: number;
  totalValue: number;
}