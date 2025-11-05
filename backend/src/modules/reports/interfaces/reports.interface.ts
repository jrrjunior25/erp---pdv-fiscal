export interface ReportFilters {
  startDate: Date;
  endDate: Date;
  sellerId?: string;
  customerId?: string;
  paymentMethod?: string;
  shiftId?: string;
}

export interface SalesReportData {
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
  salesByDay: Array<{
    date: string;
    sales: number;
    revenue: number;
  }>;
  salesByPayment: Array<{
    method: string;
    count: number;
    total: number;
  }>;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  salesBySeller: Array<{
    sellerName: string;
    sales: number;
    revenue: number;
  }>;
}

export interface ReportOptions {
  type: 'SALES' | 'PRODUCTS' | 'CUSTOMERS' | 'FINANCIAL';
  format: 'PDF' | 'EXCEL' | 'CSV';
  filters: ReportFilters;
  includeCharts?: boolean;
  groupBy?: 'DAY' | 'WEEK' | 'MONTH';
}