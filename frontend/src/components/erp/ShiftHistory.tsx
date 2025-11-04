import React, { useState, useMemo } from 'react';
import type { CashShift } from '@types';

interface ShiftHistoryProps {
  shifts: CashShift[];
}

const ShiftHistory: React.FC<ShiftHistoryProps> = ({ shifts }) => {
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Aberto' | 'Fechado'>('Todos');
  
  const sortedShifts = useMemo(() => 
    [...shifts].sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()),
    [shifts]
  );

  const filteredShifts = useMemo(() => {
    if (statusFilter === 'Todos') return sortedShifts;
    if (statusFilter === 'Aberto') return sortedShifts.filter(s => !s.closedAt);
    return sortedShifts.filter(s => s.closedAt);
  }, [sortedShifts, statusFilter]);

  const stats = useMemo(() => {
    const closed = shifts.filter(s => s.closedAt);
    const totalSales = closed.reduce((sum, s) => sum + (s.totalSales || 0), 0);
    const totalDifference = closed.reduce((sum, s) => sum + (s.balanceDifference || 0), 0);
    const openShifts = shifts.filter(s => !s.closedAt).length;
    
    return { totalShifts: shifts.length, totalSales, totalDifference, openShifts };
  }, [shifts]);
  
  const formatCurrency = (value: number | null | undefined) => {
      if (value === null || typeof value === 'undefined') return 'N/A';
      return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  const getDifferenceClass = (diff: number | null | undefined) => {
      if (diff === null || typeof diff === 'undefined' || diff === 0) return 'text-gray-900';
      return diff > 0 ? 'text-green-600' : 'text-red-600';
  }

  const getDifferenceBadge = (diff: number | null | undefined) => {
    if (diff === null || typeof diff === 'undefined' || diff === 0) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Exato</span>;
    }
    if (diff > 0) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Sobra</span>;
    }
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Falta</span>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Histórico de Turnos</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total de Turnos</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{stats.totalShifts}</p>
          <p className="text-sm opacity-80 mt-1">Registrados</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total em Vendas</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(stats.totalSales)}</p>
          <p className="text-sm opacity-80 mt-1">Turnos fechados</p>
        </div>

        <div className={`bg-gradient-to-br ${stats.totalDifference >= 0 ? 'from-purple-500 to-purple-600' : 'from-orange-500 to-orange-600'} rounded-xl p-6 text-white shadow-lg`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Diferença Total</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(stats.totalDifference)}</p>
          <p className="text-sm opacity-80 mt-1">{stats.totalDifference >= 0 ? 'Sobra' : 'Falta'}</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Turnos Abertos</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{stats.openShifts}</p>
          <p className="text-sm opacity-80 mt-1">Em andamento</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filtrar por status:</span>
          {(['Todos', 'Aberto', 'Fechado'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abertura</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fechamento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operador</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Vendas</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Esperado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Fechado</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Diferença</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredShifts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-500">
                    Nenhum turno encontrado.
                  </td>
                </tr>
              ) : null}
              {filteredShifts.map((shift) => (
                <tr key={shift.id} className={`hover:bg-gray-50 transition-colors ${!shift.closedAt ? 'bg-blue-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(shift.openedAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {shift.closedAt ? (
                      <span className="text-gray-900">{new Date(shift.closedAt).toLocaleString('pt-BR')}</span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">ABERTO</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shift.userName || shift.operatorName || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold text-right">{formatCurrency(shift.totalSales)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold text-right">{formatCurrency(shift.expectedBalance)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold text-right">{formatCurrency(shift.closingBalance)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex flex-col items-center gap-1">
                      {getDifferenceBadge(shift.balanceDifference)}
                      <span className={`text-xs font-bold ${getDifferenceClass(shift.balanceDifference)}`}>
                        {formatCurrency(shift.balanceDifference)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShiftHistory;