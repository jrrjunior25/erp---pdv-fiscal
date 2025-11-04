import React, { useState, useMemo } from 'react';
import type { SaleRecord } from '@types';

interface SalesHistoryProps {
  sales: SaleRecord[];
}

const SalesHistory: React.FC<SalesHistoryProps> = ({ sales }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPayment, setFilterPayment] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const filteredSales = useMemo(() => {
    let filtered = [...sales];

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(sale => 
        sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de pagamento
    if (filterPayment !== 'all') {
      filtered = filtered.filter(sale => 
        sale.payments?.some(p => p.method === filterPayment) ||
        sale.paymentMethod === filterPayment
      );
    }

    // Filtro de data
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.timestamp || sale.createdAt);
        
        if (dateFilter === 'today') {
          return saleDate >= today;
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return saleDate >= weekAgo;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return saleDate >= monthAgo;
        }
        return true;
      });
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(b.timestamp || b.createdAt).getTime();
      const dateB = new Date(a.timestamp || a.createdAt).getTime();
      return dateA - dateB;
    });
  }, [sales, searchTerm, filterPayment, dateFilter]);

  const stats = useMemo(() => {
    const total = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalDiscount = filteredSales.reduce((sum, sale) => sum + (sale.totalDiscount || 0), 0);
    const totalItems = filteredSales.reduce((sum, sale) => 
      sum + (sale.items?.reduce((s, i) => s + i.quantity, 0) || 0), 0
    );
    const avgTicket = filteredSales.length > 0 ? total / filteredSales.length : 0;

    return { total, totalDiscount, totalItems, avgTicket, count: filteredSales.length };
  }, [filteredSales]);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">Relatório de Vendas</h2>
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-4 border border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm">Total de Vendas</p>
              <p className="text-2xl font-bold text-white">{stats.count}</p>
            </div>
            <svg className="w-10 h-10 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-4 border border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-200 text-sm">Faturamento</p>
              <p className="text-2xl font-bold text-white">{stats.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            </div>
            <svg className="w-10 h-10 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-4 border border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm">Ticket Médio</p>
              <p className="text-2xl font-bold text-white">{stats.avgTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            </div>
            <svg className="w-10 h-10 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg p-4 border border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-200 text-sm">Itens Vendidos</p>
              <p className="text-2xl font-bold text-white">{stats.totalItems}</p>
            </div>
            <svg className="w-10 h-10 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-brand-secondary rounded-lg border border-brand-border p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Buscar</label>
            <input
              type="text"
              placeholder="Cliente ou ID da venda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-brand-primary border border-brand-border text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Período</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-brand-primary border border-brand-border text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas</option>
              <option value="today">Hoje</option>
              <option value="week">Últimos 7 dias</option>
              <option value="month">Últimos 30 dias</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Pagamento</label>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="w-full bg-brand-primary border border-brand-border text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="PIX">PIX</option>
              <option value="Credito">Crédito</option>
              <option value="Debito">Débito</option>
              <option value="Fiado">Fiado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-brand-secondary rounded-lg border border-brand-border overflow-hidden">
        <table className="min-w-full divide-y divide-brand-border">
          <thead className="bg-brand-border/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-subtle uppercase tracking-wider">Data / Hora</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-subtle uppercase tracking-wider">Cliente</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-subtle uppercase tracking-wider">Pagamento</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-brand-subtle uppercase tracking-wider">Descontos</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-brand-subtle uppercase tracking-wider">Itens</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-brand-subtle uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {filteredSales.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-brand-subtle">
                  Nenhuma venda registrada ainda.
                </td>
              </tr>
            )}
            {filteredSales.map((sale) => (
              <tr key={sale.id} className="hover:bg-brand-border/30">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">
                    {sale.timestamp || sale.createdAt 
                      ? new Date(sale.timestamp || sale.createdAt).toLocaleString('pt-BR')
                      : 'Data não disponível'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-brand-subtle">{sale.customerName || 'Não identificado'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-brand-subtle flex items-center gap-2">
                    {sale.payments?.map(p => p.method).join(', ') || sale.paymentMethod || 'N/A'}
                    {(sale.loyaltyPointsRedeemed || 0) > 0 && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-900/50 text-yellow-300" title={`${sale.loyaltyPointsRedeemed} pontos resgatados`}>
                            Pontos
                        </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400 font-semibold text-right">
                  {(sale.totalDiscount || 0) > 0 ? `-${(sale.totalDiscount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : 'R$ 0,00'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text text-right">
                  {sale.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-accent font-semibold text-right">
                  {sale.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesHistory;