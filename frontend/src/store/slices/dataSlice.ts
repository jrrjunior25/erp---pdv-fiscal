import { StateCreator } from 'zustand';
import type { Product, Customer, Supplier } from '@types';

export interface DataState {
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  isLoading: boolean;
  setProducts: (products: Product[]) => void;
  setCustomers: (customers: Customer[]) => void;
  setSuppliers: (suppliers: Supplier[]) => void;
  setLoading: (loading: boolean) => void;
}

export const createDataSlice: StateCreator<DataState> = (set) => ({
  products: [],
  customers: [],
  suppliers: [],
  isLoading: false,
  setProducts: (products) => set({ products }),
  setCustomers: (customers) => set({ customers }),
  setSuppliers: (suppliers) => set({ suppliers }),
  setLoading: (isLoading) => set({ isLoading }),
});