import React, { useState, useMemo } from 'react';
import type { CashShift } from '@types';

interface CloseShiftModalProps {
    shift: CashShift;
    onClose: () => void;
    onSubmit: (closingBalance: number) => void;
}

const InfoRow: React.FC<{ label: string; value: string | number; className?: string; isCurrency?: boolean }> = ({ label, value, className, isCurrency = true }) => {
    const formattedValue = typeof value === 'number' && isCurrency
        ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : value;
    
    return (
        <div className={`flex justify-between items-center py-2 border-b border-brand-border/50 ${className}`}>
            <span className="text-sm text-brand-subtle">{label}</span>
            <span className="text-sm font-semibold text-brand-text">{formattedValue}</span>
        </div>
    );
};

const CloseShiftModal: React.FC<CloseShiftModalProps> = ({ shift, onClose, onSubmit }) => {
    const [counted, setCounted] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const summary = useMemo(() => {
        const openingBalance = shift.openingBalance || 0;
        const totalSuprimentos = shift.totalSuprimentos || 0;
        const totalSangrias = shift.totalSangrias || 0;
        const suprimentos = totalSuprimentos - openingBalance;
        const totalSalesCash = shift.paymentTotals?.Dinheiro || 0;
        const totalSalesElectronic = (shift.paymentTotals?.PIX || 0) + (shift.paymentTotals?.Credito || 0) + (shift.paymentTotals?.Debito || 0);
        
        const expectedCash = openingBalance + totalSalesCash + suprimentos - totalSangrias;
        
        const countedValue = parseFloat(counted) || 0;
        const difference = countedValue - expectedCash;

        return { suprimentos, expectedCash, totalSalesCash, totalSalesElectronic, difference, openingBalance, totalSangrias };
    }, [shift, counted]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const closingBalance = parseFloat(counted);
        if (!isNaN(closingBalance) && closingBalance >= 0) {
            setIsLoading(true);
            setTimeout(() => {
                onSubmit(closingBalance);
                setIsLoading(false);
            }, 500);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-700 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Fechar Turno de Caixa</h2>
                            <p className="text-sm text-gray-400">Confira os valores e finalize o turno</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 transition-colors">&times;</button>
                </div>

                {/* Resumo do Turno */}
                <div className="bg-gray-900/50 rounded-xl p-5 mb-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Resumo do Turno
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <InfoRow label="Abertura de Caixa" value={summary.openingBalance} />
                        <InfoRow label="Vendas em Dinheiro" value={summary.totalSalesCash} />
                        <InfoRow label="Suprimentos Adicionais" value={summary.suprimentos} />
                        <InfoRow label="Sangrias (Retiradas)" value={summary.totalSangrias} />
                        <InfoRow label="Vendas Eletrônicas" value={summary.totalSalesElectronic} />
                        <InfoRow label="Total Geral de Vendas" value={shift.totalSales || 0} className="font-bold"/>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-700">
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-300 font-medium">Saldo Esperado em Caixa</span>
                                <span className="text-2xl font-bold text-blue-400">
                                    {summary.expectedCash.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Abertura + Vendas + Suprimentos - Sangrias</p>
                        </div>
                    </div>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Input de Contagem */}
                    <div>
                        <label htmlFor="counted-balance" className="block text-sm font-medium text-gray-300 mb-3">
                            Valor Contado em Dinheiro
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-500">R$</span>
                            <input
                                id="counted-balance"
                                type="number"
                                value={counted}
                                onChange={(e) => setCounted(e.target.value)}
                                step="0.01"
                                min="0"
                                required
                                autoFocus
                                className="w-full text-center text-4xl font-bold bg-gray-900 border-2 border-gray-700 text-yellow-400 rounded-xl p-4 pl-16 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                                placeholder="0,00"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">Digite o valor total em dinheiro contado no caixa</p>
                    </div>

                    {/* Diferença */}
                    {counted && (
                        <div className={`rounded-xl p-5 border-2 ${
                            summary.difference === 0 
                                ? 'bg-gray-700/30 border-gray-600' 
                                : summary.difference > 0 
                                    ? 'bg-green-500/10 border-green-500/30' 
                                    : 'bg-red-500/10 border-red-500/30'
                        }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {summary.difference === 0 ? (
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    ) : summary.difference > 0 ? (
                                        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                        </svg>
                                    ) : (
                                        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                        </svg>
                                    )}
                                    <div>
                                        <span className="text-sm text-gray-400 block">
                                            {summary.difference === 0 ? 'Caixa Fechado' : summary.difference > 0 ? 'Sobra de Caixa' : 'Quebra de Caixa'}
                                        </span>
                                        <span className={`text-3xl font-bold ${
                                            summary.difference === 0 ? 'text-gray-300' : summary.difference > 0 ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                            {summary.difference.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Botões */}
                    <div className="flex gap-3 pt-2">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="flex-1 py-3 bg-gray-700 text-white font-semibold rounded-xl hover:bg-gray-600 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            disabled={isLoading || counted === '' || parseFloat(counted) < 0}
                            className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold rounded-xl hover:from-red-700 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Fechando...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Confirmar e Fechar Turno
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CloseShiftModal;