import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type {
  Product,
  Customer,
  Supplier,
  SaleRecord,
  User,
  AccountTransaction,
  StockLevel,
  StockMovement,
  CashShift,
  PurchaseOrder,
} from '@types';
import apiClient from '@services/apiClient';

interface DataContextType {
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  salesHistory: SaleRecord[];
  users: User[];
  financials: AccountTransaction[];
  stockLevels: StockLevel[];
  stockMovements: StockMovement[];
  shiftHistory: CashShift[];
  purchaseOrders: PurchaseOrder[];
  analyticsData: any;
  isLoadingData: boolean;
  refreshProducts: () => Promise<void>;
  refreshCustomers: () => Promise<void>;
  refreshSuppliers: () => Promise<void>;
  refreshSalesHistory: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  refreshFinancials: () => Promise<void>;
  refreshInventory: () => Promise<void>;
  refreshShiftHistory: () => Promise<void>;
  refreshPurchaseOrders: () => Promise<void>;
  refreshAnalytics: () => Promise<void>;
  loadAllData: () => Promise<void>;
  clearData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [financials, setFinancials] = useState<AccountTransaction[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [shiftHistory, setShiftHistory] = useState<CashShift[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const refreshProducts = useCallback(async () => {
    try {
      const data = await apiClient.get<Product[]>('/products');
      setProducts(data);
    } catch (error) {
      console.error('Failed to refresh products', error);
    }
  }, []);

  const refreshCustomers = useCallback(async () => {
    try {
      const data = await apiClient.get<Customer[]>('/customers');
      setCustomers(data);
    } catch (error) {
      console.error('Failed to refresh customers', error);
    }
  }, []);

  const refreshSuppliers = useCallback(async () => {
    try {
      const data = await apiClient.get<Supplier[]>('/suppliers');
      setSuppliers(data);
    } catch (error) {
      console.error('Failed to refresh suppliers', error);
    }
  }, []);

  const refreshSalesHistory = useCallback(async () => {
    try {
      const data = await apiClient.get<SaleRecord[]>('/sales/history');
      setSalesHistory(data);
    } catch (error) {
      console.error('Failed to refresh sales history', error);
    }
  }, []);

  const refreshUsers = useCallback(async () => {
    try {
      const data = await apiClient.get<any[]>('/users');
      const mappedUsers = data.map(user => ({
        ...user,
        status: user.active ? 'Active' : 'Inactive'
      }));
      setUsers(mappedUsers);
    } catch (error) {
      console.error('Failed to refresh users', error);
    }
  }, []);

  const refreshFinancials = useCallback(async () => {
    try {
      const data = await apiClient.get<AccountTransaction[]>('/financials');
      setFinancials(data);
    } catch (error) {
      console.error('Failed to refresh financials', error);
    }
  }, []);

  const refreshInventory = useCallback(async () => {
    try {
      const [levels, movements] = await Promise.all([
        apiClient.get<StockLevel[]>('/inventory/levels'),
        apiClient.get<StockMovement[]>('/inventory/movements'),
      ]);
      setStockLevels(levels);
      setStockMovements(movements);
    } catch (error) {
      console.error('Failed to refresh inventory', error);
    }
  }, []);

  const refreshShiftHistory = useCallback(async () => {
    try {
      const data = await apiClient.get<CashShift[]>('/shifts/history');
      setShiftHistory(data);
    } catch (error) {
      console.error('Failed to refresh shift history', error);
    }
  }, []);

  const refreshPurchaseOrders = useCallback(async () => {
    try {
      const data = await apiClient.get<any[]>('/purchasing/orders');
      const mappedOrders: PurchaseOrder[] = data.map(order => ({
        id: order.id,
        supplierId: order.supplierId,
        supplierName: order.supplier?.name || 'N/A',
        items: (order.items || []).map((item: any) => ({
          productId: item.productId,
          productName: item.product?.name || 'N/A',
          quantity: item.quantity,
          cost: item.cost,
        })),
        totalCost: order.total || 0,
        status: order.status === 'PENDING' ? 'Pendente' : 
                order.status === 'Recebido' ? 'Recebido' : 
                order.status === 'Cancelado' ? 'Cancelado' : 'Pendente',
        createdAt: order.createdAt,
        receivedAt: order.receivedAt,
      }));
      setPurchaseOrders(mappedOrders);
    } catch (error) {
      console.error('Failed to refresh purchase orders', error);
    }
  }, []);

  const refreshAnalytics = useCallback(async () => {
    try {
      const data = await apiClient.get<any>('/analytics/dashboard');
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to refresh analytics', error);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      await Promise.all([
        refreshProducts(),
        refreshCustomers(),
        refreshSuppliers(),
        refreshSalesHistory(),
        refreshUsers(),
        refreshFinancials(),
        refreshInventory(),
        refreshShiftHistory(),
        refreshPurchaseOrders(),
        refreshAnalytics(),
      ]);
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setIsLoadingData(false);
    }
  }, [
    refreshProducts,
    refreshCustomers,
    refreshSuppliers,
    refreshSalesHistory,
    refreshUsers,
    refreshFinancials,
    refreshInventory,
    refreshShiftHistory,
    refreshPurchaseOrders,
    refreshAnalytics,
  ]);

  const clearData = useCallback(() => {
    setProducts([]);
    setCustomers([]);
    setSuppliers([]);
    setSalesHistory([]);
    setUsers([]);
    setFinancials([]);
    setStockLevels([]);
    setStockMovements([]);
    setShiftHistory([]);
    setPurchaseOrders([]);
    setAnalyticsData(null);
  }, []);

  const value: DataContextType = {
    products,
    customers,
    suppliers,
    salesHistory,
    users,
    financials,
    stockLevels,
    stockMovements,
    shiftHistory,
    purchaseOrders,
    analyticsData,
    isLoadingData,
    refreshProducts,
    refreshCustomers,
    refreshSuppliers,
    refreshSalesHistory,
    refreshUsers,
    refreshFinancials,
    refreshInventory,
    refreshShiftHistory,
    refreshPurchaseOrders,
    refreshAnalytics,
    loadAllData,
    clearData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
