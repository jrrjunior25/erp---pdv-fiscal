import React, { useState, useEffect } from 'react';
import apiClient from '@services/apiClient';
import ConfirmationModal from './ConfirmationModal';

interface OpenShift {
  id: string;
  number: number;
  userId: string;
  openingCash: number;
  status: string;
  openedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

const ActiveShiftsManagement: React.FC = () => {
  const [openShifts, setOpenShifts] = useState<OpenShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShift, setSelectedShift] = useState<OpenShift | null>(null);
  const [isCloseModalOpen, setCloseModalOpen] = useState(false);
  const [closingBalance, setClosingBalance] = useState('');

  useEffect(() => {
    loadOpenShifts();
  }, []);

  const loadOpenShifts = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<OpenShift[]>('/shifts/open/all');
      setOpenShifts(data);
    } catch (error) {
      console.error('Error loading open shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCloseModal = (shift: OpenShift) => {
    setSelectedShift(shift);
    setClosingBalance('');
    setCloseModalOpen(true);
  };

  const handleCloseShift = async () => {
    if (!selectedShift || !closingBalance) return;

    try {
      await apiClient.post(`/shifts/close/${selectedShift.id}`, {
        closingBalance: parseFloat(closingBalance),
      });
      setCloseModalOpen(false);
      setSelectedShift(null);
      loadOpenShifts();
    } catch (error) {
      console.error('Error closing shift:', error);
      alert('Erro ao fechar turno: ' + (error as any).message);
    }
  };

  const getShiftDuration = (openedAt: string) => {
    const opened = new Date(openedAt);
    const now = new Date();
    const diff = now.getTime() - opened.getTime();
    const hours = Math.floor(diff / 1000 / 60 / 60);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    return `${hours}h ${minutes}min`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-900 text-xl">Carregando turnos ativos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Turnos Ativos</h2>
          <p className="text-gray-600 mt-1">
            {openShifts.length === 0 
              ? 'Nenhum turno aberto no momento' 
              : `${openShifts.length} turno(s) aberto(s)`}
          </p>
        </div>
        <button
          onClick={loadOpenShifts}
          className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
        >
          ↻ Atualizar
        </button>
      </div>

      {openShifts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">✓</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Todos os Turnos Estão Fechados</h3>
          <p className="text-gray-600">
            Não há nenhum turno de caixa aberto no momento. Os usuários podem abrir novos turnos conforme necessário.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {openShifts.map((shift) => (
            <div
              key={shift.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:border-blue-300 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl font-bold text-blue-600">
                      Turno #{shift.number}
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                      ABERTO
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Usuário:</span>
                      <p className="text-gray-900 font-semibold">{shift.user.name}</p>
                      <p className="text-gray-500 text-xs">{shift.user.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Aberto em:</span>
                      <p className="text-gray-900 font-semibold">
                        {new Date(shift.openedAt).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-gray-500 text-xs">
                        Há {getShiftDuration(shift.openedAt)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Saldo Inicial:</span>
                      <p className="text-gray-900 font-semibold">
                        {shift.openingCash.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => handleOpenCloseModal(shift)}
                    className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                  >
                    Fechar Turno
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isCloseModalOpen && selectedShift && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Fechar Turno #{selectedShift.number}
            </h3>
            <p className="text-gray-600 mb-2">
              Usuário: <strong className="text-gray-900">{selectedShift.user.name}</strong>
            </p>
            <p className="text-gray-600 mb-4">
              Aberto em: <strong className="text-gray-900">
                {new Date(selectedShift.openedAt).toLocaleString('pt-BR')}
              </strong>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor Contado em Dinheiro (R$)
              </label>
              <input
                type="number"
                value={closingBalance}
                onChange={(e) => setClosingBalance(e.target.value)}
                step="0.01"
                min="0"
                required
                autoFocus
                className="w-full text-center text-2xl font-bold bg-white border border-gray-300 text-blue-600 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0,00"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-yellow-800 text-sm">
                <strong>Atenção:</strong> Você está fechando um turno de outro usuário. 
                Certifique-se de conferir o valor contado antes de confirmar.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setCloseModalOpen(false);
                  setSelectedShift(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCloseShift}
                disabled={!closingBalance}
                className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Confirmar Fechamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveShiftsManagement;
