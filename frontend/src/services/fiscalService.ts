import apiClient from './apiClient';

/**
 * The response from the backend after an attempt to issue an NFC-e.
 */
export interface NFCeIssuanceResponse {
    success: boolean;
    nfceId: string;
    number: number;
    series: number;
    accessKey: string;
    xml: string;
    qrCodeUrl: string;
    status: string;
    protocol?: string;
    message: string;
}

/**
 * Configuration fiscal (emitter, PIX, NFC-e)
 */
export interface FiscalConfig {
    emitter: {
        cnpj: string;
        name: string;
        fantasyName: string;
        ie: string;
        address: {
            street: string;
            number: string;
            neighborhood: string;
            city: string;
            state: string;
            zipCode: string;
        };
    } | null;
    pix: {
        pixKey: string;
        merchantName: string;
        merchantCity: string;
    } | null;
    nfce: {
        environment: string;
        series: number;
        hasCertificate: boolean;
        certExpiresAt?: Date;
    };
}

/**
 * Sends sale data to the backend to generate and transmit an NFC-e.
 */
export const issueNFCe = async (saleId: string, items: any[], total: number, customerCpf?: string, customerName?: string): Promise<NFCeIssuanceResponse> => {
    try {
        const response = await apiClient.post<NFCeIssuanceResponse>('/fiscal/issue-nfce', {
            saleId,
            items,
            total,
            customerCpf,
            customerName,
        });
        return response;
    } catch (error) {
        console.error("Error issuing NFC-e:", error);
        throw error;
    }
};

/**
 * Get fiscal configuration
 */
export const getFiscalConfig = async (): Promise<FiscalConfig> => {
    try {
        const response = await apiClient.get<FiscalConfig>('/fiscal/config');
        return response;
    } catch (error) {
        console.error("Error fetching fiscal config:", error);
        throw error;
    }
};

/**
 * Save fiscal configuration
 */
export const saveFiscalConfig = async (config: any): Promise<any> => {
    try {
        const response = await apiClient.post('/fiscal/config', config);
        return response;
    } catch (error) {
        console.error("Error saving fiscal config:", error);
        throw error;
    }
};

/**
 * Upload digital certificate
 */
export const uploadCertificate = async (certificate: string, password: string): Promise<any> => {
    try {
        const response = await apiClient.post('/fiscal/certificate', {
            certificate,
            password,
        });
        return response;
    } catch (error) {
        console.error("Error uploading certificate:", error);
        throw error;
    }
};

/**
 * Check SEFAZ service status
 */
export const checkSefazStatus = async (): Promise<{ online: boolean; message: string }> => {
    try {
        const response = await apiClient.get<{ online: boolean; message: string }>('/fiscal/sefaz/status');
        return response;
    } catch (error) {
        console.error("Error checking SEFAZ status:", error);
        return { online: false, message: 'Erro ao verificar status' };
    }
};
