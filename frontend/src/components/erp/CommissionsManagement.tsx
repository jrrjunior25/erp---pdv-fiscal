import React, { useState, useEffect } from 'react';
import { getCommissionReport, payMultipleCommissions, CommissionReport } from '@services/commissionsService';

const CommissionsManagement: React.FC = () => {
  const [report, setReport] = useState<CommissionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommissions, setSelectedCommissions] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await getCommissionReport();
      setReport(data);
    } catch (error) {
      console.error('Error loading commission report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaySelected = async () => {
    if (selectedCommissions.size === 0) {
      alert('Selecione pelo menos uma comissão para pagar');
      return;
    }

    if (!confirm(`Confirma o pagamento de ${selectedCommissions.size} comissão(ões)?`)) {
      return;
    }

    setProcessing(true);
    try {
      await payMultipleCommissions(Array.from(selectedCommissions));
      setSelectedCommissions(new Set());
      await loadReport();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao pagar comissões');
    } finally {
      setProcessing(false);
    }
  };

  const toggleCommission = (commissionId: string) => {
    const newSelected = new Set(selectedCommissions);
    if (newSelected.has(commissionId)) {
      newSelected.delete(commissionId);
    } else {
      newSelected.add(commissionId);
    }
    setSelectedCommissions(newSelected);
  };

  const calculateSelectedTotal = (seller: CommissionReport) => {
    return seller.commissions
      .filter(c => c.status === 'PENDING' && selectedCommissions.has(c.id))
      .reduce((sum, c) => sum + c.commissionValue, 0);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-gray-900">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Comissões</h1>
        <div className="flex gap-3">
          {selectedCommissions.size > 0 && (
            <button
              onClick={handlePaySelected}
              disabled={processing}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium shadow-sm"
            >
              Pagar Selecionadas ({selectedCommissions.size})
            </button>
          )}
          <button onClick={loadReport} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm">
            Atualizar
          </button>
        </div>
      </div>

      {report.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-gray-500">Nenhuma comissão encontrada</p>
        </div>
      ) : (
        <div className="space-y-6">
          {report.map((seller) => (
            <div key={seller.seller.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{seller.seller.name}</h2>
                  <p className="text-sm text-gray-600">Taxa: {seller.seller.commissionRate}%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Vendido</p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {seller.totalSalesValue.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600">Vendas</p>
                  <p className="text-xl font-bold text-blue-700">{seller.totalSales}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-600">Comissão Total</p>
                  <p className="text-xl font-bold text-purple-700">
                    R$ {seller.totalCommissionValue.toFixed(2)}
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-yellow-600">Pendente</p>
                  <p className="text-xl font-bold text-yellow-700">
                    R$ {seller.pendingCommissionValue.toFixed(2)}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600">Pago</p>
                  <p className="text-xl font-bold text-green-700">
                    R$ {seller.paidCommissionValue.toFixed(2)}
                  </p>
                </div>
              </div>

              {seller.commissions.filter(c => c.status === 'PENDING').length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">Comissões Pendentes</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {seller.commissions
                      .filter(c => c.status === 'PENDING')
                      .map((commission) => (
                        <div
                          key={commission.id}
                          className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCommissions.has(commission.id)}
                            onChange={() => toggleCommission(commission.id)}
                            className="w-5 h-5 rounded"
                          />
                          <div className="flex-1">
                            <p className="text-gray-900 font-medium">
                              Venda #{commission.sale?.number}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(commission.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              R$ {commission.saleTotal.toFixed(2)}
                            </p>
                            <p className="text-gray-900 font-bold">
                              R$ {commission.commissionValue.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                  {calculateSelectedTotal(seller) > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg flex justify-between items-center">
                      <span className="text-gray-900 font-medium">Total Selecionado:</span>
                      <span className="text-xl font-bold text-blue-600">
                        R$ {calculateSelectedTotal(seller).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommissionsManagement;
