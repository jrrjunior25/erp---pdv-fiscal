import React, { useState, useEffect } from 'react';
import apiClient from '@services/apiClient';
import { downloadFile } from '@utils/downloadHelper';

interface AnalyticsData {
  salesMetrics: {
    totalSales: number;
    totalRevenue: number;
    averageTicket: number;
    topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  };
  customerMetrics: {
    totalCustomers: number;
    newCustomers: number;
    loyaltyPoints: number;
  };
  inventoryMetrics: {
    lowStockItems: number;
    totalProducts: number;
    stockValue: number;
  };
}

interface ReportData {
  sales: {
    daily: Array<{ date: string; total: number; count: number }>;
    monthly: Array<{ month: string; total: number; count: number }>;
    byProduct: Array<{ product: string; quantity: number; revenue: number }>;
    byCustomer: Array<{ customer: string; total: number; count: number }>;
  };
  financial: {
    cashFlow: Array<{ date: string; income: number; expense: number }>;
    receivables: Array<{ customer: string; amount: number; dueDate: string }>;
    payables: Array<{ supplier: string; amount: number; dueDate: string }>;
  };
  inventory: {
    stockLevels: Array<{ product: string; current: number; minimum: number }>;
    movements: Array<{ product: string; type: string; quantity: number; date: string }>;
  };
}

const ReportsAndAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'reports'>('analytics');
  const [activeReport, setActiveReport] = useState<'sales' | 'financial' | 'inventory'>('sales');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalytics();
    } else {
      loadReportData();
    }
  }, [activeTab, period, activeReport, dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<AnalyticsData>(`/analytics?period=${period}`);
      setAnalytics(data);
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReportData = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<ReportData>(`/reports/${activeReport}?start=${dateRange.start}&end=${dateRange.end}`);
      setReportData(data);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = () => {
    downloadFile(`/api/analytics/export/excel?period=${period}`, `analytics_${period}d_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportReport = async (format: 'excel' | 'pdf') => {
    try {
      const response = await fetch(`/api/reports/${activeReport}/export?format=${format}&start=${dateRange.start}&end=${dateRange.end}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_${activeReport}_${dateRange.start}_${dateRange.end}.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Erro ao exportar relatório');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Relatórios e Analytics</h2>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 Analytics
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'reports'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📋 Relatórios
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {activeTab === 'analytics' ? (
              <select 
                value={period} 
                onChange={(e) => setPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
              </select>
            ) : (
              <>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-500">até</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </>
            )}
          </div>
          
          <div className="flex gap-2">
            {activeTab === 'analytics' ? (
              <button
                onClick={exportAnalytics}
                className="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                📊 Exportar Analytics
              </button>
            ) : (
              <>
                <button
                  onClick={() => exportReport('excel')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                >
                  📊 Excel
                </button>
                <button
                  onClick={() => exportReport('pdf')}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                >
                  📄 PDF
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Carregando dados...</span>
        </div>
      ) : (
        <>
          {activeTab === 'analytics' && analytics ? (
            <div className="space-y-6">
              {/* Analytics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium opacity-90">Vendas</h3>
                    <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold">{analytics.salesMetrics.totalSales}</p>
                  <p className="text-sm opacity-80">
                    Receita: {analytics.salesMetrics.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium opacity-90">Clientes</h3>
                    <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold">{analytics.customerMetrics.totalCustomers}</p>
                  <p className="text-sm opacity-80">Novos: {analytics.customerMetrics.newCustomers}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium opacity-90">Estoque</h3>
                    <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold">{analytics.inventoryMetrics.totalProducts}</p>
                  <p className="text-sm opacity-80">Baixo estoque: {analytics.inventoryMetrics.lowStockItems}</p>
                </div>
              </div>

              {/* Top Products */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Top Produtos</h3>
                <div className="space-y-3">
                  {analytics.salesMetrics.topProducts.map((product, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <span className="font-medium">{product.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{product.quantity} vendidos</div>
                        <div className="text-sm text-gray-500">
                          {product.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'reports' ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              {/* Report Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'sales', label: 'Vendas', icon: '💰' },
                    { id: 'financial', label: 'Financeiro', icon: '📈' },
                    { id: 'inventory', label: 'Estoque', icon: '📦' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveReport(tab.id as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeReport === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Report Content */}
              <div className="p-6">
                {activeReport === 'sales' && reportData?.sales && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold mb-3">Vendas por Produto</h3>
                        <div className="space-y-2">
                          {reportData.sales.byProduct.slice(0, 5).map((item, index) => (
                            <div key={index} className="flex justify-between">
                              <span className="text-sm">{item.product}</span>
                              <span className="font-semibold">
                                {item.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold mb-3">Vendas Mensais</h3>
                        <div className="space-y-2">
                          {reportData.sales.monthly.map((item, index) => (
                            <div key={index} className="flex justify-between">
                              <span className="text-sm">{item.month}</span>
                              <span className="font-semibold">
                                {item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeReport === 'financial' && reportData?.financial && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold mb-3">Contas a Receber</h3>
                        <div className="space-y-2">
                          {reportData.financial.receivables.slice(0, 5).map((item, index) => (
                            <div key={index} className="flex justify-between">
                              <span className="text-sm">{item.customer}</span>
                              <span className="font-semibold text-green-600">
                                {item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold mb-3">Contas a Pagar</h3>
                        <div className="space-y-2">
                          {reportData.financial.payables.slice(0, 5).map((item, index) => (
                            <div key={index} className="flex justify-between">
                              <span className="text-sm">{item.supplier}</span>
                              <span className="font-semibold text-red-600">
                                {item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeReport === 'inventory' && reportData?.inventory && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Produtos com Estoque Baixo</h3>
                      <div className="space-y-2">
                        {reportData.inventory.stockLevels
                          .filter(item => item.current <= item.minimum)
                          .slice(0, 10)
                          .map((item, index) => (
                            <div key={index} className="flex justify-between">
                              <span className="text-sm">{item.product}</span>
                              <span className="font-semibold text-orange-600">{item.current}/{item.minimum}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default ReportsAndAnalytics;