import React, { useState, useEffect } from 'react';
import apiClient from '@services/apiClient';

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

const ReportsManagement: React.FC = () => {
  const [activeReport, setActiveReport] = useState<'sales' | 'financial' | 'inventory'>('sales');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadReportData();
  }, [activeReport, dateRange]);

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

  if (loading) return <div className="p-6">Carregando relatórios...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Relatórios</h2>
        <div className="flex gap-2">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-3 py-2 border rounded-lg"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-3 py-2 border rounded-lg"
          />
          <button
            onClick={() => exportReport('excel')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            📊 Excel
          </button>
          <button
            onClick={() => exportReport('pdf')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            📄 PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
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
                        <span className="font-semibold">{item.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
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
                        <span className="font-semibold">{item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
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
                        <span className="font-semibold text-green-600">{item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
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
                        <span className="font-semibold text-red-600">{item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
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
    </div>
  );
};

export default ReportsManagement;