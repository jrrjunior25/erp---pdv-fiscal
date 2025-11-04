import React, { useState, useEffect } from 'react';
import { createReturn, SaleReturnItem } from '@services/returnsService';

interface ReturnModalProps {
  sale: any;
  onClose: () => void;
  onSuccess: () => void;
}

const ReturnModal: React.FC<ReturnModalProps> = ({ sale, onClose, onSuccess }) => {
  const [type, setType] = useState<'DEVOLUCAO' | 'TROCA'>('DEVOLUCAO');
  const [reason, setReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('DINHEIRO');
  const [observations, setObservations] = useState('');
  const [selectedItems, setSelectedItems] = useState<Map<string, SaleReturnItem>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleItemToggle = (item: any) => {
    const newSelected = new Map(selectedItems);
    
    if (newSelected.has(item.id)) {
      newSelected.delete(item.id);
    } else {
      newSelected.set(item.id, {
        saleItemId: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      });
    }
    
    setSelectedItems(newSelected);
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const newSelected = new Map(selectedItems);
    const item = newSelected.get(itemId);
    
    if (item) {
      item.quantity = Math.min(quantity, sale.items.find((si: any) => si.id === itemId)?.quantity || 0);
      newSelected.set(itemId, item);
      setSelectedItems(newSelected);
    }
  };

  const calculateTotal = () => {
    let total = 0;
    selectedItems.forEach(item => {
      total += item.quantity * item.price;
    });
    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedItems.size === 0) {
      setError('Selecione pelo menos um item para devolver');
      return;
    }

    if (!reason.trim()) {
      setError('Informe o motivo da devolução');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createReturn({
        saleId: sale.id,
        type,
        reason,
        refundMethod,
        observations,
        items: Array.from(selectedItems.values()),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar devolução');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-brand-secondary border-b border-brand-border p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-brand-text">
              {type === 'DEVOLUCAO' ? 'Devolução' : 'Troca'} de Produtos
            </h2>
            <p className="text-sm text-brand-subtle">Venda #{sale.number}</p>
          </div>
          <button onClick={onClose} className="text-brand-subtle hover:text-brand-text text-2xl">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-brand-text mb-2">Tipo</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="DEVOLUCAO"
                  checked={type === 'DEVOLUCAO'}
                  onChange={(e) => setType(e.target.value as 'DEVOLUCAO')}
                  className="text-brand-accent"
                />
                <span className="text-brand-text">Devolução</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="TROCA"
                  checked={type === 'TROCA'}
                  onChange={(e) => setType(e.target.value as 'TROCA')}
                  className="text-brand-accent"
                />
                <span className="text-brand-text">Troca</span>
              </label>
            </div>
          </div>

          {/* Itens da Venda */}
          <div>
            <label className="block text-sm font-medium text-brand-text mb-2">
              Selecione os itens a devolver
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto border border-brand-border rounded-lg p-4">
              {sale.items?.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-3 bg-brand-primary rounded-lg border border-brand-border"
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => handleItemToggle(item)}
                    className="w-5 h-5"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-brand-text">{item.product?.name || 'Produto'}</p>
                    <p className="text-sm text-brand-subtle">
                      Qtd: {item.quantity} × R$ {item.price.toFixed(2)}
                    </p>
                  </div>
                  {selectedItems.has(item.id) && (
                    <input
                      type="number"
                      min="1"
                      max={item.quantity}
                      value={selectedItems.get(item.id)?.quantity || 1}
                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                      className="w-20 px-2 py-1 bg-brand-secondary border border-brand-border rounded text-brand-text"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-brand-text mb-2">
              Motivo da Devolução *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 bg-brand-primary border border-brand-border rounded-lg text-brand-text"
              required
            >
              <option value="">Selecione...</option>
              <option value="Produto com defeito">Produto com defeito</option>
              <option value="Produto errado">Produto errado</option>
              <option value="Não atendeu expectativa">Não atendeu expectativa</option>
              <option value="Arrependimento">Arrependimento</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          {/* Forma de Reembolso */}
          <div>
            <label className="block text-sm font-medium text-brand-text mb-2">
              Forma de Reembolso
            </label>
            <select
              value={refundMethod}
              onChange={(e) => setRefundMethod(e.target.value)}
              className="w-full px-4 py-2 bg-brand-primary border border-brand-border rounded-lg text-brand-text"
            >
              <option value="DINHEIRO">Dinheiro</option>
              <option value="CREDITO_LOJA">Crédito em Loja</option>
              <option value="ESTORNO_CARTAO">Estorno no Cartão</option>
              <option value="PIX">PIX</option>
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-brand-text mb-2">
              Observações
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-brand-primary border border-brand-border rounded-lg text-brand-text"
              placeholder="Informações adicionais..."
            />
          </div>

          {/* Total */}
          <div className="bg-brand-primary border border-brand-border rounded-lg p-4">
            <div className="flex justify-between items-center text-lg">
              <span className="font-medium text-brand-text">Total a Devolver:</span>
              <span className="text-2xl font-bold text-brand-accent">
                R$ {calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-4">
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-brand-border rounded-lg text-brand-text hover:bg-brand-primary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-brand-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              disabled={loading || selectedItems.size === 0}
            >
              {loading ? 'Criando...' : 'Criar Devolução'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnModal;
