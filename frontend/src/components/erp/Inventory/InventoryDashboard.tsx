import React, { useState, useEffect } from 'react';
import apiClient from '@services/apiClient';

interface InventoryStats {
  totalValue: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
}

const InventoryDashboard: React.FC = () => {
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await apiClient.get('/inventory/report');
      setStats({
        totalValue: data.totalValue,
        totalProducts: data.totalProducts,
        lowStockCount: data.lowStockItems,
        outOfStockCount: data.outOfStockItems
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (type: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/inventory/reports/${type}/pdf`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_${type}_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
    }
  };

  const downloadExcel = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/inventory/reports/stock/excel`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `estoque_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
    } catch (error) {
      console.error('Erro ao baixar Excel:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Gestão de Estoque</h2>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-brand-secondary rounded-lg border border-brand-border p-4">
          <div className="text-brand-subtle text-sm mb-1">Valor Total</div>
          <div className="text-2xl font-bold text-white">
            {stats?.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>
        <div className="bg-brand-secondary rounded-lg border border-brand-border p-4">
          <div className="text-brand-subtle text-sm mb-1">Total Produtos</div>
          <div className="text-2xl font-bold text-white">{stats?.totalProducts}</div>
        </div>
        <div className="bg-brand-secondary rounded-lg border border-brand-border p-4">
          <div className="text-brand-subtle text-sm mb-1">Estoque Baixo</div>
          <div className="text-2xl font-bold text-yellow-500">{stats?.lowStockCount}</div>
        </div>
        <div className="bg-brand-secondary rounded-lg border border-brand-border p-4">
          <div className="text-brand-subtle text-sm mb-1">Sem Estoque</div>
          <div className="text-2xl font-bold text-red-500">{stats?.outOfStockCount}</div>
        </div>
      </div>

      <div className="bg-brand-secondary rounded-lg border border-brand-border p-6">
        <h3 className="text-lg font-bold text-white mb-4">Relatórios</h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => downloadPDF('stock')}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
            </svg>
            Estoque PDF
          </button>
          <button
            onClick={downloadExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L13 1.586A2 2 0 0011.586 1H9z"/>
            </svg>
            Estoque Excel
          </button>
          <button
            onClick={() => downloadPDF('low-stock')}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            Estoque Baixo PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryDashboard;
