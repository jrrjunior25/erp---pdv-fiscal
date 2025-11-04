import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import apiClient from '@services/apiClient';

interface PixPaymentModalProps {
  amount: number;
  saleId?: string;
  customerName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PixPaymentModal: React.FC<PixPaymentModalProps> = ({
  amount,
  saleId,
  customerName,
  onClose,
  onSuccess,
}) => {
  const [pixData, setPixData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    generatePix();
  }, []);

  useEffect(() => {
    if (pixData?.expiresAt) {
      const expiryTime = new Date(pixData.expiresAt).getTime();
      
      const interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
        setTimeRemaining(remaining);

        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [pixData]);

  const generatePix = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/fiscal/generate-pix', {
        amount,
        saleId,
        customerName,
        description: `Venda PDV ${saleId || ''}`,
      });

      setPixData(response);
    } catch (err) {
      setError('Erro ao gerar PIX. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (pixData?.qrCode) {
      navigator.clipboard.writeText(pixData.qrCode);
      alert('Código PIX copiado!');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-brand-secondary rounded-lg p-8 max-w-lg w-full mx-4 border border-brand-border">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-brand-text">Pagamento PIX</h2>
          <button
            onClick={onClose}
            className="text-brand-subtle hover:text-brand-text"
          >
            ✕
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto"></div>
            <p className="text-brand-text mt-4">Gerando QR Code...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-4">
            <p className="text-red-200">{error}</p>
            <button
              onClick={generatePix}
              className="mt-2 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-600"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* PIX QR Code */}
        {pixData && !loading && (
          <div className="space-y-6">
            {/* Amount */}
            <div className="text-center">
              <p className="text-brand-subtle text-sm">Valor a pagar</p>
              <p className="text-4xl font-bold text-brand-accent">
                R$ {amount.toFixed(2)}
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center bg-white p-6 rounded-lg">
              <QRCodeSVG value={pixData.qrCode} size={220} level="M" />
            </div>

            {/* Instructions */}
            <div className="bg-brand-primary rounded-lg p-4 space-y-2">
              <p className="text-brand-text font-semibold text-center">
                Como pagar:
              </p>
              <ol className="text-brand-subtle text-sm space-y-1 pl-4">
                <li>1. Abra o app do seu banco</li>
                <li>2. Escolha pagar com PIX</li>
                <li>3. Escaneie o QR Code acima</li>
                <li>4. Confirme o pagamento</li>
              </ol>
            </div>

            {/* Copy Code */}
            <div>
              <button
                onClick={copyToClipboard}
                className="w-full py-3 bg-brand-primary hover:bg-brand-border text-brand-text rounded-lg border border-brand-border transition-colors"
              >
                📋 Copiar Código PIX (Copia e Cola)
              </button>
            </div>

            {/* Timer */}
            {timeRemaining > 0 && (
              <div className="text-center">
                <p className="text-brand-subtle text-sm">
                  QR Code expira em:{' '}
                  <span className="text-brand-accent font-semibold">
                    {formatTime(timeRemaining)}
                  </span>
                </p>
              </div>
            )}

            {timeRemaining === 0 && (
              <div className="text-center">
                <p className="text-red-500 text-sm mb-2">QR Code expirado</p>
                <button
                  onClick={generatePix}
                  className="px-4 py-2 bg-brand-accent text-white rounded hover:bg-blue-500"
                >
                  Gerar Novo QR Code
                </button>
              </div>
            )}

            {/* TxID */}
            <div className="text-center">
              <p className="text-brand-subtle text-xs">
                ID da Transação: {pixData.txId}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-brand-primary hover:bg-brand-border text-brand-text rounded-lg border border-brand-border transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onSuccess}
                className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition-colors"
              >
                ✓ Confirmar Pagamento
              </button>
            </div>

            {/* Warning */}
            <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-3">
              <p className="text-yellow-200 text-xs text-center">
                ⚠️ Clique em "Confirmar Pagamento" após o cliente finalizar o pagamento
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PixPaymentModal;
