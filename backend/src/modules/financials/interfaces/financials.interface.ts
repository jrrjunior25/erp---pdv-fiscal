export interface FinancialTransaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  category: string;
  date: Date;
  userId: string;
  createdAt: Date;
}

export interface FinancialFilters {
  type?: 'INCOME' | 'EXPENSE';
  category?: string;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}