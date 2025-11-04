import React, { useState } from 'react';

interface OpenShiftModalProps {
    onOpen: (openingBalance: number) => void;
}

const OpenShiftModal: React.FC<OpenShiftModalProps> = ({ onOpen }) => {
    const [balance, setBalance] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const openingBalance = parseFloat(balance);
        if (!isNaN(openingBalance) && openingBalance >= 0) {
            setIsLoading(true);
            // Simulate a slight delay
            setTimeout(() => {
                onOpen(openingBalance);
                setIsLoading(false);
            }, 500);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-700 w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Abrir Caixa</h2>
                    <p className="text-gray-400 text-sm">Informe o valor inicial de troco para iniciar o turno</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="opening-balance" className="block text-sm font-medium text-gray-300 mb-3">
                            Valor de Abertura
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-500">R$</span>
                            <input
                                id="opening-balance"
                                type="number"
                                value={balance}
                                onChange={(e) => setBalance(e.target.value)}
                                step="0.01"
                                min="0"
                                required
                                autoFocus
                                className="w-full text-center text-4xl font-bold bg-gray-900 border-2 border-gray-700 text-green-400 rounded-xl p-4 pl-16 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                placeholder="0,00"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">Digite o valor do troco inicial disponível no caixa</p>
                    </div>

                    <button 
                        type="submit"
                        disabled={isLoading || balance === '' || parseFloat(balance) < 0}
                        className="w-full py-4 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-xl hover:from-green-700 hover:to-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Abrindo Caixa...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Confirmar e Abrir Caixa
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OpenShiftModal;