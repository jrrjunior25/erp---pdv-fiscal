import React from 'react';

interface ParsedNFeData {
  nfeNumber: string;
  nfeKey: string;
  issueDate: string;
  supplier: {
    cnpj: string;
    name: string;
    fantasyName: string;
    email: string;
    phone: string;
    address: string;
    exists: boolean;
  };
  products: Array<{
    code: string;
    barcode: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    exists: boolean;
  }>;
  totals: {
    productsCount: number;
    newProducts: number;
    existingProducts: number;
    totalValue: number;
  };
}

interface NFeConfirmationModalProps {
  parsedData: ParsedNFeData;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}

const NFeConfirmationModal: React.FC<NFeConfirmationModalProps> = ({ 
  parsedData, 
  onConfirm, 
  onCancel, 
  isProcessing 
}) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div 
        className="bg-brand-secondary rounded-lg shadow-2xl border border-brand-border w-full max-w-6xl max-h-[90vh] flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-brand-border flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white">Conferência de NF-e</h2>
            <p className="text-sm text-brand-subtle mt-1">
              Revise os dados antes de confirmar a importação
            </p>
          </div>
          <button onClick={onCancel} className="text-brand-subtle hover:text-white text-3xl">&times;</button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {/* NF-e Info */}
          <div className="bg-brand-primary/30 rounded-lg p-4 border border-brand-border">
            <h3 className="text-lg font-bold text-brand-accent mb-3">Informações da Nota</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-brand-subtle">Número:</span>
                <p className="text-white font-semibold">{parsedData.nfeNumber}</p>
              </div>
              <div>
                <span className="text-brand-subtle">Data de Emissão:</span>
                <p className="text-white font-semibold">
                  {new Date(parsedData.issueDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <span className="text-brand-subtle">Valor Total:</span>
                <p className="text-white font-semibold">
                  {parsedData.totals.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>
          </div>

          {/* Supplier Info */}
          <div className="bg-brand-primary/30 rounded-lg p-4 border border-brand-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-brand-accent">Fornecedor</h3>
              {parsedData.supplier.exists ? (
                <span className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-xs font-semibold">
                  Já Cadastrado
                </span>
              ) : (
                <span className="px-3 py-1 bg-green-900/50 text-green-300 rounded-full text-xs font-semibold">
                  Será Cadastrado
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-brand-subtle">CNPJ:</span>
                <p className="text-white font-semibold">{parsedData.supplier.cnpj}</p>
              </div>
              <div>
                <span className="text-brand-subtle">Razão Social:</span>
                <p className="text-white font-semibold">{parsedData.supplier.name}</p>
              </div>
              <div>
                <span className="text-brand-subtle">Nome Fantasia:</span>
                <p className="text-white font-semibold">{parsedData.supplier.fantasyName || '-'}</p>
              </div>
              <div>
                <span className="text-brand-subtle">Telefone:</span>
                <p className="text-white font-semibold">{parsedData.supplier.phone || '-'}</p>
              </div>
              <div className="col-span-2">
                <span className="text-brand-subtle">Endereço:</span>
                <p className="text-white font-semibold">{parsedData.supplier.address || '-'}</p>
              </div>
            </div>
          </div>

          {/* Products Summary */}
          <div className="bg-brand-primary/30 rounded-lg p-4 border border-brand-border">
            <h3 className="text-lg font-bold text-brand-accent mb-3">Resumo dos Produtos</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-brand-subtle">Total de Itens:</span>
                <p className="text-white font-bold text-xl">{parsedData.totals.productsCount}</p>
              </div>
              <div>
                <span className="text-brand-subtle">Produtos Novos:</span>
                <p className="text-green-400 font-bold text-xl">{parsedData.totals.newProducts}</p>
              </div>
              <div>
                <span className="text-brand-subtle">Produtos Existentes:</span>
                <p className="text-blue-400 font-bold text-xl">{parsedData.totals.existingProducts}</p>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-brand-primary/30 rounded-lg border border-brand-border overflow-hidden">
            <h3 className="text-lg font-bold text-brand-accent p-4 border-b border-brand-border">
              Produtos da Nota
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-brand-border/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-brand-subtle uppercase">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-brand-subtle uppercase">Descrição</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-brand-subtle uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-brand-subtle uppercase">Qtd</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-brand-subtle uppercase">Valor Unit.</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-brand-subtle uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {parsedData.products.map((product, index) => (
                    <tr key={index} className="hover:bg-brand-border/30">
                      <td className="px-4 py-3 text-sm text-white font-mono">{product.code}</td>
                      <td className="px-4 py-3 text-sm text-white">{product.name}</td>
                      <td className="px-4 py-3 text-center">
                        {product.exists ? (
                          <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-xs font-semibold">
                            Existente
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-900/50 text-green-300 rounded text-xs font-semibold">
                            Novo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-white font-semibold">
                        {product.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-white">
                        {product.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-brand-accent font-semibold">
                        {product.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-brand-border/50">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-right text-sm font-bold text-white">
                      TOTAL DA NOTA:
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-brand-accent">
                      {parsedData.totals.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 className="text-yellow-400 font-semibold mb-1">Atenção!</h4>
                <p className="text-sm text-yellow-200/80">
                  Ao confirmar, os seguintes dados serão registrados no sistema:
                </p>
                <ul className="list-disc list-inside text-sm text-yellow-200/80 mt-2 space-y-1">
                  {!parsedData.supplier.exists && (
                    <li>O fornecedor <strong>{parsedData.supplier.name}</strong> será cadastrado</li>
                  )}
                  {parsedData.totals.newProducts > 0 && (
                    <li><strong>{parsedData.totals.newProducts}</strong> novo(s) produto(s) será(ão) cadastrado(s)</li>
                  )}
                  <li>O estoque será atualizado com <strong>{parsedData.totals.productsCount}</strong> entrada(s)</li>
                  <li>Um registro de compra será criado no valor de <strong>{parsedData.totals.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-4 p-6 border-t border-brand-border flex-shrink-0">
          <button 
            onClick={onCancel}
            disabled={isProcessing}
            className="bg-brand-border text-white font-semibold px-6 py-2 rounded-md hover:bg-brand-border/70 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            disabled={isProcessing}
            className="bg-green-600 text-white font-semibold px-8 py-2 rounded-md hover:bg-green-500 disabled:opacity-50 disabled:cursor-wait transition-colors flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Confirmando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Confirmar e Dar Entrada
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NFeConfirmationModal;
