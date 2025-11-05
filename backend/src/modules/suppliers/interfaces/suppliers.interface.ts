export interface Supplier {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  contact?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierFilters {
  name?: string;
  cnpj?: string;
  active?: boolean;
}

export interface SupplierStats {
  total: number;
  active: number;
  inactive: number;
}