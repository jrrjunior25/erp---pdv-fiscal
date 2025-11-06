import React, { useState, useMemo } from 'react';
import type { StockLevel, StockMovement, Product, InventoryReport, NFeImportResult, InventoryCountItem } from '@types';
import InventoryCountModal from './InventoryCountModal';
import NFeImportModal from './NFeImportModal';

interface InventoryManagementProps {
    stockLevels: StockLevel[];
    stockMovements: StockMovement[];
    products: Product[];
    onProcessInventoryCount: (items: InventoryCountItem[]) => Promise<InventoryReport>;
    onNFeImport: (file: File) => Promise<NFeImportResult>;
}

const InventoryManagement: React.FC<InventoryManagementProps> = ({ stockLevels, stockMovements, products, onProcessInventoryCount, onNFeImport }) => {
    const [isCountModalOpen, setCountModalOpen] = useState(false);
    const [isImportModalOpen, setImportModalOpen] = useState(false);
    const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null);
    const [importResult, setImportResult] = useState<NFeImportResult | null>(null);

    const sortedMovements = useMemo(() => 
        [...stockMovements].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        [stockMovements]
    );

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out'>('all');
    const [sortBy, setSortBy] = useState<'name' | 'quantity'>('name');

    const stats = useMemo(() => {
        const totalItems = stockLevels.length;
        const totalQuantity = stockLevels.reduce((sum, s) => sum + s.quantity, 0);
        const lowStock = stockLevels.filter(s => s.quantity > 0 && s.quantity < 10).length;
        const outOfStock = stockLevels.filter(s => s.quantity === 0).length;
        const totalValue = stockLevels.reduce((sum, s) => {
            const product = products.find(p => p.id === s.productId);
            return sum + (product ? product.price * s.quantity : 0);
        }, 0);
        const recentMovements = stockMovements.filter(m => 
            new Date(m.timestamp).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
        ).length;
        
        return { totalItems, totalQuantity, lowStock, outOfStock, totalValue, recentMovements };
    }, [stockLevels, stockMovements, products]);

    const filteredStock = useMemo(() => {
        let filtered = stockLevels.filter(s => 
            s.productName.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filterStatus === 'low') filtered = filtered.filter(s => s.quantity > 0 && s.quantity < 10);
        if (filterStatus === 'out') filtered = filtered.filter(s => s.quantity === 0);

        return filtered.sort((a, b) => {
            if (sortBy === 'name') return a.productName.localeCompare(b.productName);
            return a.quantity - b.quantity;
        });
    }, [stockLevels, searchTerm, filterStatus, sortBy]);

    const handleStartInventoryCount = () => {
        setInventoryReport(null);
        setCountModalOpen(true);
    }
    
    const handleStartNFeImport = () => {
        setImportResult(null);
        setImportModalOpen(true);
    }

    const handleFinishInventoryCount = async (items: InventoryCountItem[]) => {
        const report = await onProcessInventoryCount(items);
        setCountModalOpen(false);
        setInventoryReport(report);
    }

    const handleFinishNFeImport = (result: NFeImportResult) => {
        setImportModalOpen(false);
        setImportResult(result);
    }

    const getMovementTypeBadge = (type: StockMovement['type']) => {
        const styles = {
            'Venda': 'bg-red-100 text-red-700',
            'Ajuste de Inventário': 'bg-yellow-100 text-yellow-700',
            'Entrada Inicial': 'bg-green-100 text-green-700',
            'Entrada (NF-e)': 'bg-blue-100 text-blue-700',
            'Entrada (Compra)': 'bg-purple-100 text-purple-700'
        };
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type] || 'bg-gray-100 text-gray-700'}`}>{type}</span>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Gestão de Estoque</h2>
                    <p className="text-sm text-gray-500 mt-1">Controle completo do inventário</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.open('/api/inventory/export/template', '_blank')}
                        className="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                    >
                        📥 Modelo
                    </button>
                    <button
                        onClick={() => window.open('/api/inventory/export/excel', '_blank')}
                        className="bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
                    >
                        📊 Exportar
                    </button>
                    <button 
                        onClick={handleStartNFeImport}
                        className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        Importar NF-e
                    </button>
                    <button 
                        onClick={handleStartInventoryCount}
                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                        Inventário
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-medium opacity-90 uppercase">Produtos</h3>
                        <svg className="w-7 h-7 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    </div>
                    <p className="text-3xl font-bold">{stats.totalItems}</p>
                    <p className="text-xs opacity-80 mt-1">Itens cadastrados</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-medium opacity-90 uppercase">Quantidade</h3>
                        <svg className="w-7 h-7 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                    </div>
                    <p className="text-3xl font-bold">{stats.totalQuantity}</p>
                    <p className="text-xs opacity-80 mt-1">Unidades em estoque</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-medium opacity-90 uppercase">Valor Total</h3>
                        <svg className="w-7 h-7 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-3xl font-bold">{stats.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    <p className="text-xs opacity-80 mt-1">Valor do inventário</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-medium opacity-90 uppercase">Estoque Baixo</h3>
                        <svg className="w-7 h-7 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <p className="text-3xl font-bold">{stats.lowStock}</p>
                    <p className="text-xs opacity-80 mt-1">Abaixo de 10 unidades</p>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-medium opacity-90 uppercase">Sem Estoque</h3>
                        <svg className="w-7 h-7 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </div>
                    <p className="text-3xl font-bold">{stats.outOfStock}</p>
                    <p className="text-xs opacity-80 mt-1">Produtos zerados</p>
                </div>
            </div>

            {importResult && importResult.summary && importResult.details && (
                 <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                     <h3 className="text-lg font-bold text-gray-900 mb-4">Resumo da Importação NF-e #{importResult.summary.invoiceNumber || 'N/A'}</h3>
                     <div className="grid grid-cols-2 gap-6 text-sm">
                        <div className="space-y-2">
                            <p className="text-gray-700"><strong>Fornecedor:</strong> {importResult.details.supplierName} {importResult.summary.supplierCreated && <span className="text-green-600 font-semibold">(Novo)</span>}</p>
                            <p className="text-gray-700"><strong>Itens Processados:</strong> {importResult.summary.productsProcessed}</p>
                            <p className="text-gray-700"><strong>Novos Produtos:</strong> {importResult.summary.newProductsCreated}</p>
                            <p className="text-gray-700"><strong>Entradas no Estoque:</strong> {importResult.summary.stockEntries}</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-2">Produtos na Nota:</h4>
                            <ul className="space-y-1">
                                {importResult.details.products.map(p => (
                                    <li key={p.code} className="text-gray-700">
                                        {p.name} - {p.quantity} un. {p.isNew && <span className="text-yellow-600 font-semibold">(Novo)</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                     </div>
                 </div>
            )}

            {inventoryReport && inventoryReport.discrepancies && (
                 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                     <h3 className="text-lg font-bold text-gray-900 mb-4">Relatório de Inventário - {new Date(inventoryReport.timestamp).toLocaleString('pt-BR')}</h3>
                     {inventoryReport.discrepancies.length === 0 ? (
                         <p className="text-green-600 font-medium">✓ Nenhuma discrepância encontrada. O estoque está correto.</p>
                     ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Esperado</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Contado</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Diferença</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {inventoryReport.discrepancies.map(d => (
                                        <tr key={d.productId}>
                                            <td className="px-4 py-2 text-sm text-gray-900">{d.productName}</td>
                                            <td className="px-4 py-2 text-sm text-gray-600 text-right">{d.expected}</td>
                                            <td className="px-4 py-2 text-sm text-gray-900 text-right">{d.counted}</td>
                                            <td className={`px-4 py-2 text-sm font-bold text-right ${d.difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {d.difference > 0 ? '+' : ''}{d.difference}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     )}
                 </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">Estoque Atual</h3>
                            <div className="flex gap-2">
                                <button onClick={() => setSortBy(sortBy === 'name' ? 'quantity' : 'name')} className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md font-medium text-gray-700">
                                    {sortBy === 'name' ? '↕ Nome' : '↕ Qtd'}
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <input type="text" placeholder="Buscar produto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                <option value="all">Todos</option>
                                <option value="low">Estoque Baixo</option>
                                <option value="out">Sem Estoque</option>
                            </select>
                        </div>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor Unit.</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor Total</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredStock.map(item => {
                                    const product = products.find(p => p.id === item.productId);
                                    const totalValue = product ? product.price * item.quantity : 0;
                                    return (
                                        <tr key={item.productId} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3 text-sm text-gray-900">{item.productName}</td>
                                            <td className="px-6 py-3 text-center">
                                                {item.quantity === 0 ? (
                                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Zerado</span>
                                                ) : item.quantity < 10 ? (
                                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">Baixo</span>
                                                ) : (
                                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">OK</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">{item.quantity}</td>
                                            <td className="px-6 py-3 text-right text-sm text-gray-600">{product?.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || '-'}</td>
                                            <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900">{totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Movimentações</h3>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto">
                         <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qtd</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sortedMovements.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-xs text-gray-600">{new Date(item.timestamp).toLocaleString('pt-BR')}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{item.productName}</td>
                                        <td className="px-4 py-3">{getMovementTypeBadge(item.type)}</td>
                                        <td className={`px-4 py-3 text-right text-sm font-bold ${item.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {item.quantityChange > 0 ? '+' : ''}{item.quantityChange}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isCountModalOpen && (
                <InventoryCountModal 
                    products={products}
                    onClose={() => setCountModalOpen(false)}
                    onSubmit={handleFinishInventoryCount}
                />
            )}
            {isImportModalOpen && (
                <NFeImportModal
                    onClose={() => setImportModalOpen(false)}
                    onImport={onNFeImport}
                    onComplete={handleFinishNFeImport}
                />
            )}
        </div>
    );
};

export default InventoryManagement;