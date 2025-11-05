export interface Customer {
  id: string;
  name: string;
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  loyaltyPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerFilters {
  name?: string;
  document?: string;
  email?: string;
}

export interface CustomerStats {
  total: number;
  active: number;
  inactive: number;
  totalLoyaltyPoints: number;
}