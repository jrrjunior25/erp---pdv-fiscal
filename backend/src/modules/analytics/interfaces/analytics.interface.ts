export interface AnalyticsData {
  metric: string;
  value: number;
  period: string;
  date: Date;
  comparison?: number;
}

export interface AnalyticsFilters {
  metric: 'SALES' | 'REVENUE' | 'PRODUCTS' | 'CUSTOMERS';
  period: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
  startDate?: Date;
  endDate?: Date;
}

export interface DashboardMetrics {
  totalSales: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  salesGrowth: number;
  revenueGrowth: number;
}