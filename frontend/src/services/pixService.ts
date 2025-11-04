import apiClient from './apiClient';

export interface PixCharge {
    success: boolean;
    qrCode: string;
    txId: string;
    amount: number;
    expiresAt: Date;
    message: string;
}

/**
 * Requests the backend to generate a new PIX charge for a given amount.
 * 
 * @param amount The value of the PIX charge to be created.
 * @param saleId Optional sale ID
 * @param customerName Optional customer name
 * @param description Optional description
 * @returns A promise that resolves with the PIX charge details, including the QR code data.
 */
export const generatePixCharge = async (
    amount: number, 
    saleId?: string, 
    customerName?: string,
    description?: string
): Promise<PixCharge> => {
    try {
        const response = await apiClient.post<PixCharge>('/fiscal/generate-pix', {
            amount,
            saleId,
            customerName,
            description,
        });
        return response;
    } catch (error) {
        console.error("Error generating PIX charge:", error);
        throw error;
    }
};