import apiClient from './apiClient';

export interface EnrichedProductData {
  name?: string;
  brand?: string;
  ncm?: string;
  ncmDescription?: string;
  cstIcms?: string;
  cstPis?: string;
  cstCofins?: string;
  cfop?: string;
  origem?: string;
}

/**
 * Busca informações do produto por código de barras
 */
export async function searchByBarcode(barcode: string): Promise<EnrichedProductData | null> {
  try {
    const data = await apiClient.get<any>(`/products/enrich/barcode/${barcode}`);
    
    if (!data) return null;

    return {
      name: data.description,
      brand: data.brand,
      ncm: data.ncm,
    };
  } catch (error) {
    console.error('[ProductEnrichment] Erro ao buscar por código de barras:', error);
    return null;
  }
}

/**
 * Busca dados fiscais (NCM, CST) baseado na descrição do produto
 */
export async function suggestFiscalData(
  description: string,
  category?: string
): Promise<EnrichedProductData | null> {
  try {
    const data = await apiClient.post<any>('/products/enrich/fiscal', {
      description,
      category,
    });
    
    return data || null;
  } catch (error) {
    console.error('[ProductEnrichment] Erro ao buscar dados fiscais:', error);
    return null;
  }
}

/**
 * Busca NCM baseado em palavras-chave
 */
export async function searchNCM(query: string): Promise<Array<{
  ncm: string;
  description: string;
  confidence: number;
}>> {
  try {
    const data = await apiClient.get<any>(`/products/enrich/ncm?q=${encodeURIComponent(query)}`);
    return data || [];
  } catch (error) {
    console.error('[ProductEnrichment] Erro ao buscar NCM:', error);
    return [];
  }
}

/**
 * Enriquece dados completos do produto (barcode + descrição)
 */
export async function enrichCompleteProductData(params: {
  barcode?: string;
  name?: string;
  category?: string;
}): Promise<EnrichedProductData | null> {
  try {
    const data = await apiClient.post<any>('/products/enrich/complete', params);
    return data || null;
  } catch (error) {
    console.error('[ProductEnrichment] Erro ao enriquecer dados:', error);
    return null;
  }
}
