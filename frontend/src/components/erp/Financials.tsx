
import React, { useState, useMemo } from 'react';
import type { AccountTransaction } from '@types';

interface FinancialsProps {
  transactions: AccountTransaction[];
  onUpdateStatus: (transactionId: string) => void;
}

const FinancialsTable: React.FC<{ title: string; data: AccountTransaction[], onUpdateStatus: (transactionId: string) => void; }> = ({ title, data, onUpdateStatus }) => {
    const getStatusBadge = (status: 'Pendente' | 'Pago' | 'Atrasado') => {
        const styles = {
            'Pago': 'bg-green-100 text-green-700',
            'Atrasado': 'bg-red-100 text-red-700',
            'Pendente': 'bg-yellow-100 text-yellow-700'
        };
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>{status}</span>;
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{new Date(item.dueDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                                <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                                <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                                    {item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {(item.status === 'Pendente' || item.status === 'Atrasado') && (
                                        <button
                                            onClick={() => onUpdateStatus(item.id)}
                                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm"
                                        >
                                            Marcar como Pago
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const Financials: React.FC<FinancialsProps> = ({ transactions, onUpdateStatus }) => {
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Pendente' | 'Pago' | 'Atrasado'>('Todos');

  const payable = useMemo(() => transactions.filter(t => t.type === 'payable'), [transactions]);
  const receivable = useMemo(() => transactions.filter(t => t.type === 'receivable'), [transactions]);

  const filteredPayable = useMemo(() => 
    statusFilter === 'Todos' ? payable : payable.filter(t => t.status === statusFilter),
    [payable, statusFilter]
  );

  const filteredReceivable = useMemo(() => 
    statusFilter === 'Todos' ? receivable : receivable.filter(t => t.status === statusFilter),
    [receivable, statusFilter]
  );

  const stats = useMemo(() => {
    const totalPayable = payable.reduce((sum, t) => sum + t.amount, 0);
    const totalReceivable = receivable.reduce((sum, t) => sum + t.amount, 0);
    const pendingPayable = payable.filter(t => t.status !== 'Pago').reduce((sum, t) => sum + t.amount, 0);
    const pendingReceivable = receivable.filter(t => t.status !== 'Pago').reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalPayable,
      totalReceivable,
      pendingPayable,
      pendingReceivable,
      balance: totalReceivable - totalPayable
    };
  }, [payable, receivable]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Financeiro</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Contas a Pagar</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{stats.totalPayable.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          <p className="text-sm opacity-80 mt-1">Pendente: {stats.pendingPayable.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Contas a Receber</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{stats.totalReceivable.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          <p className="text-sm opacity-80 mt-1">Pendente: {stats.pendingReceivable.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>

        <div className={`bg-gradient-to-br ${stats.balance >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} rounded-xl p-6 text-white shadow-lg`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Saldo</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{stats.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          <p className="text-sm opacity-80 mt-1">{stats.balance >= 0 ? 'Positivo' : 'Negativo'}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total Pendente</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{(stats.pendingPayable + stats.pendingReceivable).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          <p className="text-sm opacity-80 mt-1">{payable.filter(t => t.status !== 'Pago').length + receivable.filter(t => t.status !== 'Pago').length} transações</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filtrar por status:</span>
          {(['Todos', 'Pendente', 'Pago', 'Atrasado'] as const).map(status => (
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

      <div className="space-y-6">
        <FinancialsTable title="Contas a Pagar" data={filteredPayable} onUpdateStatus={onUpdateStatus} />
        <FinancialsTable title="Contas a Receber" data={filteredReceivable} onUpdateStatus={onUpdateStatus} />
      </div>
    </div>
  );
};

export default Financials;
