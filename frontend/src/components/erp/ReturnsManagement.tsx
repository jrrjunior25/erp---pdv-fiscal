import React, { useState, useEffect } from 'react';
import { getReturns, processReturn, cancelReturn, SaleReturn } from '@services/returnsService';

const ReturnsManagement: React.FC = () => {
  const [returns, setReturns] = useState<SaleReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedReturn, setSelectedReturn] = useState<SaleReturn | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadReturns();
  }, [statusFilter, typeFilter]);

  const loadReturns = async () => {
    setLoading(true);
    try {
      const data = await getReturns({
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      });
      setReturns(data);
    } catch (error) {
      console.error('Error loading returns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (returnId: string) => {
    if (!confirm('Confirma o processamento desta devolução? O estoque será atualizado.')) return;

    setProcessing(true);
    try {
      await processReturn(returnId);
      await loadReturns();
      setSelectedReturn(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao processar devolução');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async (returnId: string) => {
    if (!confirm('Confirma o cancelamento desta devolução?')) return;

    setProcessing(true);
    try {
      await cancelReturn(returnId);
      await loadReturns();
      setSelectedReturn(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao cancelar devolução');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      PROCESSED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700'
    };
    const labels = { PENDING: 'Pendente', PROCESSED: 'Processado', CANCELLED: 'Cancelado' };
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700'}`}>{labels[status as keyof typeof labels] || status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Devoluções e Trocas</h1>
        <button onClick={loadReturns} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm">
          Atualizar
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex gap-4">
        <div className="flex-1">
          <label className="block text-sm text-gray-700 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos</option>
            <option value="PENDING">Pendente</option>
            <option value="PROCESSED">Processado</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm text-gray-700 mb-1">Tipo</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos</option>
            <option value="DEVOLUCAO">Devolução</option>
            <option value="TROCA">Troca</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-900">Carregando...</div>
        </div>
      ) : returns.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-gray-500">Nenhuma devolução encontrada</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {returns.map((ret) => (
            <div
              key={ret.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:border-blue-300 cursor-pointer transition-colors"
              onClick={() => setSelectedReturn(ret)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Devolução #{ret.number}</h3>
                  <p className="text-sm text-gray-600">
                    Venda #{ret.sale?.number} - {new Date(ret.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(ret.status)}
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                    {ret.type === 'DEVOLUCAO' ? 'Devolução' : 'Troca'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Cliente</p>
                  <p className="text-gray-900 font-medium">{ret.sale?.customer?.name || 'Não identificado'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Motivo</p>
                  <p className="text-gray-900 font-medium">{ret.reason}</p>
                </div>
                <div>
                  <p className="text-gray-600">Forma de Reembolso</p>
                  <p className="text-gray-900 font-medium">{ret.refundMethod}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total</p>
                  <p className="text-gray-900 font-bold text-lg">R$ {ret.total.toFixed(2)}</p>
                </div>
              </div>

              {ret.items && ret.items.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">{ret.items.length} item(ns) devolvido(s)</p>
                </div>
              )}

              {ret.status === 'PENDING' && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleProcess(ret.id); }}
                    disabled={processing}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium shadow-sm"
                  >
                    Processar
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCancel(ret.id); }}
                    disabled={processing}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium shadow-sm"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedReturn(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full m-4 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Devolução #{selectedReturn.number}</h2>
              <button onClick={() => setSelectedReturn(null)} className="text-gray-500 hover:text-gray-900 text-2xl">×</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  {getStatusBadge(selectedReturn.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo</p>
                  <p className="text-gray-900 font-medium">{selectedReturn.type === 'DEVOLUCAO' ? 'Devolução' : 'Troca'}</p>
                </div>
              </div>

              {selectedReturn.items && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Itens</p>
                  <div className="space-y-2">
                    {selectedReturn.items.map((item: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 flex justify-between">
                        <span className="text-gray-900">{item.quantity}x - R$ {item.price.toFixed(2)}</span>
                        <span className="text-gray-900 font-bold">R$ {item.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedReturn.observations && (
                <div>
                  <p className="text-sm text-gray-600">Observações</p>
                  <p className="text-gray-900">{selectedReturn.observations}</p>
                </div>
              )}

              {selectedReturn.processedAt && (
                <div>
                  <p className="text-sm text-gray-600">Processado em</p>
                  <p className="text-gray-900">{new Date(selectedReturn.processedAt).toLocaleString('pt-BR')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnsManagement;
