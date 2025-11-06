import React, { useState } from 'react';
import type { SaleRecord, Emitente } from '@types/index';

interface FiscalManagementProps {
  salesHistory: SaleRecord[];
  emitente?: Emitente;
  onExportNFCe?: (saleIds: string[]) => Promise<void>;
  onConfigureEmitente?: (emitente: Emitente) => Promise<void>;
}

const FiscalManagement: React.FC<FiscalManagementProps> = ({
  salesHistory,
  emitente,
  onExportNFCe,
  onConfigureEmitente,
}) => {
  const [activeTab, setActiveTab] = useState<'nfce' | 'config' | 'reports'>('nfce');
  const [selectedSales, setSelectedSales] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const salesWithNFCe = salesHistory.filter((sale) => sale.nfceXml);
  const salesWithoutNFCe = salesHistory.filter((sale) => !sale.nfceXml);

  const handleSelectSale = (saleId: string) => {
    setSelectedSales((prev) =>
      prev.includes(saleId)
        ? prev.filter((id) => id !== saleId)
        : [...prev, saleId]
    );
  };

  const handleExportSelected = async () => {
    if (!onExportNFCe || selectedSales.length === 0) return;

    setIsExporting(true);
    try {
      await onExportNFCe(selectedSales);
      setSelectedSales([]);
    } catch (error) {
      console.error('Erro ao exportar NFC-e:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão Fiscal</h2>
          <p className="text-gray-600 mt-1">
            Gerencie NFC-e, configurações fiscais e relatórios
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.open('/api/fiscal/export/template', '_blank')}
            className="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            📥 Modelo
          </button>
          <button
            onClick={() => window.open('/api/fiscal/export/excel', '_blank')}
            className="bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
          >
            📊 Exportar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'nfce', label: 'NFC-e', icon: '📄' },
            { id: 'config', label: 'Configurações', icon: '⚙️' },
            { id: 'reports', label: 'Relatórios', icon: '📊' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'nfce' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                  <p className="text-sm opacity-90">Total de Vendas</p>
                  <p className="text-3xl font-bold mt-1">{salesHistory.length}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                  <p className="text-sm opacity-90">Com NFC-e</p>
                  <p className="text-3xl font-bold mt-1">{salesWithNFCe.length}</p>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
                  <p className="text-sm opacity-90">Sem NFC-e</p>
                  <p className="text-3xl font-bold mt-1">{salesWithoutNFCe.length}</p>
                </div>
              </div>

              {salesWithoutNFCe.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">
                      Vendas sem NFC-e ({salesWithoutNFCe.length})
                    </h3>
                    {selectedSales.length > 0 && (
                      <button
                        onClick={handleExportSelected}
                        disabled={isExporting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium shadow-sm"
                      >
                        {isExporting
                          ? 'Exportando...'
                          : `Exportar ${selectedSales.length} selecionadas`}
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={selectedSales.length === salesWithoutNFCe.length}
                              onChange={(e) =>
                                setSelectedSales(
                                  e.target.checked
                                    ? salesWithoutNFCe.map((s) => s.id)
                                    : []
                                )
                              }
                              className="rounded"
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {salesWithoutNFCe.map((sale) => (
                          <tr key={sale.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedSales.includes(sale.id)}
                                onChange={() => handleSelectSale(sale.id)}
                                className="rounded"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {new Date(sale.timestamp).toLocaleString('pt-BR')}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {sale.customerName || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                              {formatCurrency(sale.total)}
                            </td>
                            <td className="px-4 py-3">
                              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                Emitir NFC-e
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'config' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Configurações do Emitente</h3>

              {emitente ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">CNPJ</p>
                      <p className="text-gray-900 font-medium">{emitente.CNPJ}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Razão Social</p>
                      <p className="text-gray-900 font-medium">{emitente.xNome}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Nome Fantasia</p>
                      <p className="text-gray-900 font-medium">{emitente.xFant}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Inscrição Estadual</p>
                      <p className="text-gray-900 font-medium">{emitente.IE}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Endereço</p>
                    <p className="text-gray-900">
                      {emitente.enderEmit.xLgr}, {emitente.enderEmit.nro} -{' '}
                      {emitente.enderEmit.xBairro}
                    </p>
                    <p className="text-gray-900">
                      {emitente.enderEmit.xMun}/{emitente.enderEmit.UF} -{' '}
                      CEP: {emitente.enderEmit.CEP}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Nenhum emitente configurado</p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm">
                    Configurar Emitente
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Relatórios Fiscais</h3>
              <p className="text-gray-500 text-center py-8">
                Funcionalidade de relatórios em desenvolvimento
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FiscalManagement;
