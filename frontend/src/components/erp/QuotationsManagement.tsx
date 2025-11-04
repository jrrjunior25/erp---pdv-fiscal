import React, { useState, useEffect } from 'react';
import { getQuotations, convertQuotationToSale, cancelQuotation, Quotation } from '@services/quotationsService';

const QuotationsManagement: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [convertModal, setConvertModal] = useState(false);
  const [shiftId, setShiftId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('DINHEIRO');

  useEffect(() => {
    loadQuotations();
  }, [statusFilter]);

  const loadQuotations = async () => {
    setLoading(true);
    try {
      const data = await getQuotations({ status: statusFilter || undefined });
      setQuotations(data);
    } catch (error) {
      console.error('Error loading quotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!selectedQuotation || !shiftId) return;

    try {
      await convertQuotationToSale(selectedQuotation.id, shiftId, paymentMethod);
      alert('Orçamento convertido em venda com sucesso!');
      setConvertModal(false);
      setSelectedQuotation(null);
      await loadQuotations();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao converter orçamento');
    }
  };

  const handleCancel = async (quotationId: string) => {
    if (!confirm('Confirma o cancelamento deste orçamento?')) return;

    try {
      await cancelQuotation(quotationId);
      await loadQuotations();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao cancelar orçamento');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      CONVERTED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
      EXPIRED: 'bg-gray-100 text-gray-700'
    };
    const labels: any = { PENDING: 'Pendente', CONVERTED: 'Convertido', CANCELLED: 'Cancelado', EXPIRED: 'Expirado' };
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles] || styles.EXPIRED}`}>{labels[status] || status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
        <button onClick={loadQuotations} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm">
          Atualizar
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <label className="block text-sm text-gray-700 mb-1">Status</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full max-w-xs px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Todos</option>
          <option value="PENDING">Pendente</option>
          <option value="CONVERTED">Convertido</option>
          <option value="CANCELLED">Cancelado</option>
          <option value="EXPIRED">Expirado</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 text-gray-900">Carregando...</div>
      ) : quotations.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-gray-500">Nenhum orçamento encontrado</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {quotations.map((quotation) => (
            <div key={quotation.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Orçamento #{quotation.number}</h3>
                  <p className="text-sm text-gray-600">Cliente: {quotation.customer?.name || 'Não identificado'}</p>
                  <p className="text-sm text-gray-600">Vendedor: {quotation.seller?.name || 'Não definido'}</p>
                </div>
                {getStatusBadge(quotation.status)}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-bold text-gray-900">R$ {quotation.total.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Desconto</p>
                  <p className="text-xl font-bold text-gray-900">R$ {quotation.discount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Válido até</p>
                  <p className="text-gray-900">{new Date(quotation.validUntil).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              {quotation.status === 'PENDING' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelectedQuotation(quotation); setConvertModal(true); }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm"
                  >
                    Converter em Venda
                  </button>
                  <button
                    onClick={() => handleCancel(quotation.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {convertModal && selectedQuotation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full m-4 p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Converter em Venda</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">ID do Turno *</label>
                <input
                  type="text"
                  value={shiftId}
                  onChange={(e) => setShiftId(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Informe o ID do turno ativo"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Forma de Pagamento</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="DINHEIRO">Dinheiro</option>
                  <option value="PIX">PIX</option>
                  <option value="CREDITO">Crédito</option>
                  <option value="DEBITO">Débito</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleConvert}
                  disabled={!shiftId}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium shadow-sm"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => { setConvertModal(false); setSelectedQuotation(null); }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationsManagement;
