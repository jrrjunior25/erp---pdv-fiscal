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

const AnalyticsManagement: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      const data = await apiClient.get<AnalyticsData>(`/analytics?period=${period}`);
      setAnalytics(data);
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Carregando analytics...</div>;
  if (!analytics) return <div className="p-6">Erro ao carregar dados</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
        <div className="flex gap-2">
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
          <button
            onClick={() => downloadFile(`/api/analytics/export/excel?period=${period}`, `analytics_${period}d_${new Date().toISOString().split('T')[0]}.xlsx`)}
            className="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            📊 Exportar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <h3 className="text-sm font-medium opacity-90">Vendas</h3>
          <p className="text-3xl font-bold">{analytics.salesMetrics.totalSales}</p>
          <p className="text-sm opacity-80">Receita: {analytics.salesMetrics.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <h3 className="text-sm font-medium opacity-90">Clientes</h3>
          <p className="text-3xl font-bold">{analytics.customerMetrics.totalCustomers}</p>
          <p className="text-sm opacity-80">Novos: {analytics.customerMetrics.newCustomers}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <h3 className="text-sm font-medium opacity-90">Estoque</h3>
          <p className="text-3xl font-bold">{analytics.inventoryMetrics.totalProducts}</p>
          <p className="text-sm opacity-80">Baixo estoque: {analytics.inventoryMetrics.lowStockItems}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Top Produtos</h3>
        <div className="space-y-3">
          {analytics.salesMetrics.topProducts.map((product, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="font-medium">{product.name}</span>
              <div className="text-right">
                <div className="font-semibold">{product.quantity} vendidos</div>
                <div className="text-sm text-gray-500">{product.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsManagement;