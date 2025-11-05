export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'SELLER' | 'CASHIER';
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserFilters {
  name?: string;
  email?: string;
  role?: string;
  active?: boolean;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: Array<{
    role: string;
    count: number;
  }>;
}