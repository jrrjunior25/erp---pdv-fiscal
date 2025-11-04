import React, { useState, useMemo } from 'react';
import type { PurchaseOrder, Supplier, Product } from '@types';
import PurchaseOrderFormModal from './PurchaseOrderFormModal';
import ConfirmationModal from './ConfirmationModal';

interface PurchaseOrderManagementProps {
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  products: Product[];
  onAdd: (order: Omit<PurchaseOrder, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  // FIX: The status update function should only accept the valid target statuses.
  onUpdateStatus: (orderId: string, status: 'Recebido' | 'Cancelado') => Promise<void>;
}

const PurchaseOrderManagement: React.FC<PurchaseOrderManagementProps> = ({ purchaseOrders, suppliers, products, onAdd, onUpdateStatus }) => {
  const [isFormOpen, setFormOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [actionType, setActionType] = useState<'receive' | 'cancel' | null>(null);
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Pendente' | 'Recebido' | 'Cancelado'>('Todos');

  const sortedOrders = useMemo(() => 
    [...purchaseOrders].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [purchaseOrders]
  );

  const filteredOrders = useMemo(() => 
    statusFilter === 'Todos' ? sortedOrders : sortedOrders.filter(o => o.status === statusFilter),
    [sortedOrders, statusFilter]
  );

  const stats = useMemo(() => {
    const pending = purchaseOrders.filter(o => o.status === 'Pendente');
    const received = purchaseOrders.filter(o => o.status === 'Recebido');
    const totalValue = purchaseOrders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
    const pendingValue = pending.reduce((sum, o) => sum + (o.totalCost || 0), 0);
    
    return { total: purchaseOrders.length, pending: pending.length, received: received.length, totalValue, pendingValue };
  }, [purchaseOrders]);

  const handleOpenAdd = () => {
    setSelectedOrder(null);
    setFormOpen(true);
  };

  const handleOpenConfirm = (order: PurchaseOrder, type: 'receive' | 'cancel') => {
    setSelectedOrder(order);
    setActionType(type);
    setConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    if (selectedOrder && actionType) {
        const newStatus = actionType === 'receive' ? 'Recebido' : 'Cancelado';
        await onUpdateStatus(selectedOrder.id, newStatus);
        setConfirmOpen(false);
        setSelectedOrder(null);
        setActionType(null);
    }
  };

  const handleSave = async (data: any) => {
    await onAdd(data);
    setFormOpen(false);
  };
  
  const getStatusBadge = (status: PurchaseOrder['status']) => {
    const styles = {
      'Pendente': 'bg-yellow-100 text-yellow-700',
      'Recebido': 'bg-green-100 text-green-700',
      'Cancelado': 'bg-red-100 text-red-700'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Ordens de Compra</h2>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          + Nova Ordem
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total de Ordens</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{stats.total}</p>
          <p className="text-sm opacity-80 mt-1">Registradas</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Pendentes</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{stats.pending}</p>
          <p className="text-sm opacity-80 mt-1">{stats.pendingValue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Recebidas</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{stats.received}</p>
          <p className="text-sm opacity-80 mt-1">Concluídas</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Valor Total</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{stats.totalValue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
          <p className="text-sm opacity-80 mt-1">Todas as ordens</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filtrar por status:</span>
          {(['Todos', 'Pendente', 'Recebido', 'Cancelado'] as const).map(status => (
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fornecedor</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Itens</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.supplierName || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {order.items?.length || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                    {(order.totalCost || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {order.status === 'Pendente' && (
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleOpenConfirm(order, 'receive')} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm">Receber</button>
                        <button onClick={() => handleOpenConfirm(order, 'cancel')} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm">Cancelar</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {isFormOpen && (
        <PurchaseOrderFormModal
            suppliers={suppliers}
            products={products}
            onSave={handleSave}
            onClose={() => setFormOpen(false)}
        />
      )}
      {isConfirmOpen && selectedOrder && (
        <ConfirmationModal
          title={`${actionType === 'receive' ? 'Receber' : 'Cancelar'} Ordem de Compra`}
          message={`Tem certeza que deseja ${actionType === 'receive' ? 'marcar como recebida' : 'cancelar'} a ordem de compra para "${selectedOrder.supplierName}"? ${actionType === 'receive' ? 'Isso dará entrada dos itens no estoque.' : ''}`}
          onConfirm={handleConfirmAction}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
};

export default PurchaseOrderManagement;