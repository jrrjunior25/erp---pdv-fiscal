import apiClient from './apiClient';

export interface NFCeResponse {
  success: boolean;
  xml?: string;
  chave?: string;
  protocolo?: string;
  error?: string;
}

export interface PixResponse {
  success: boolean;
  qrCode?: string;
  txid?: string;
  valor?: number;
  error?: string;
}

export const emitirNFCe = async (saleId: string): Promise<NFCeResponse> => {
  try {
    return await apiClient.post<NFCeResponse>(`/fiscal/nfce/emit/${saleId}`);
  } catch (error) {
    return { success: false, error: 'Erro ao emitir NFCe' };
  }
};

export const gerarPixQR = async (valor: number, descricao?: string): Promise<PixResponse> => {
  try {
    return await apiClient.post<PixResponse>('/fiscal/pix/generate', { valor, descricao });
  } catch (error) {
    return { success: false, error: 'Erro ao gerar PIX' };
  }
};

export const consultarStatusPix = async (txid: string): Promise<{ status: string; valor?: number }> => {
  try {
    return await apiClient.get(`/fiscal/pix/status/${txid}`);
  } catch (error) {
    return { status: 'erro' };
  }
};